/**
 * Notion API Client
 *
 * Wrapper around @notionhq/client with retry logic and helper functions
 * for querying tasks, updating properties, and managing comments.
 */

import { Client } from '@notionhq/client';
import { loadConfig } from './utils/config-loader.js';

// Initialize Notion client
const { token, databaseId } = loadConfig();
const notion = new Client({ auth: token });

// Export for use by other modules (e.g., image downloader)
export { notion };

/**
 * Query tasks with MCP tags
 * @param {number} limit - Max number of tasks to return
 * @param {string|null} status - Filter by status (Ready, In Progress, Done)
 * @returns {Promise<Array>} Array of task objects with full page content
 */
export async function queryTasksWithMcpTags(limit = 100, status = null) {
  return retryWithBackoff(async () => {
    const filter = {
      and: [
        {
          property: 'MCP',
          multi_select: {
            is_not_empty: true,
          },
        },
      ],
    };

    // Add status filter if provided
    if (status) {
      filter.and.push({
        property: 'Status',
        status: {
          equals: status,
        },
      });
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      filter,
      sorts: [
        { property: 'Priority', direction: 'descending' },
        { property: 'Status', direction: 'ascending' },
      ],
      page_size: Math.min(limit, 100),
    });

    // Fetch blocks for each task to get full page content
    const tasksWithBlocks = await Promise.all(
      response.results.map(async (page) => {
        const blocks = await notion.blocks.children.list({ block_id: page.id });
        return {
          ...formatTask(page),
          blocks: blocks.results.map(block => formatBlock(block)),
          fullContent: extractFullContent(blocks.results),
        };
      })
    );

    return tasksWithBlocks;
  });
}

/**
 * Query tasks by status (with or without MCP tags)
 * @param {string} status - Status to filter by
 * @param {boolean} mcpTagsOnly - Only return tasks with MCP tags
 * @returns {Promise<Array>} Array of task objects with full page content
 */
export async function queryTasksByStatus(status, mcpTagsOnly = true) {
  return mcpTagsOnly
    ? queryTasksWithMcpTags(100, status)
    : retryWithBackoff(async () => {
        const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'Status',
            status: {
              equals: status,
            },
          },
          sorts: [
            { property: 'Priority', direction: 'descending' },
          ],
        });

        // Fetch blocks for each task to get full page content
        const tasksWithBlocks = await Promise.all(
          response.results.map(async (page) => {
            const blocks = await notion.blocks.children.list({ block_id: page.id });
            return {
              ...formatTask(page),
              blocks: blocks.results.map(block => formatBlock(block)),
              fullContent: extractFullContent(blocks.results),
            };
          })
        );

        return tasksWithBlocks;
      });
}

/**
 * Get a single task by ID
 * @param {string} pageId - Notion page ID
 * @returns {Promise<object>} Task object with full page content
 */
export async function getTask(pageId) {
  return retryWithBackoff(async () => {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const blocks = await notion.blocks.children.list({ block_id: pageId });

    return {
      ...formatTask(page),
      blocks: blocks.results.map(block => formatBlock(block)),
      fullContent: extractFullContent(blocks.results),
    };
  });
}

/**
 * Get full page content including all blocks
 * @param {string} pageId - Notion page ID
 * @returns {Promise<object>} Full task object with blocks
 */
export async function getTaskWithBlocks(pageId) {
  return retryWithBackoff(async () => {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const blocks = await notion.blocks.children.list({ block_id: pageId });

    return {
      ...formatTask(page),
      blocks: blocks.results.map(block => formatBlock(block)),
      fullContent: extractFullContent(blocks.results),
    };
  });
}

/**
 * Format a Notion block into a readable structure
 * @param {object} block - Raw Notion block object
 * @returns {object} Formatted block object
 */
function formatBlock(block) {
  const formatted = {
    id: block.id,
    type: block.type,
    hasChildren: block.has_children,
  };

  // Extract text content based on block type
  switch (block.type) {
    case 'paragraph':
      formatted.text = block.paragraph.rich_text.map(t => t.plain_text).join('');
      break;
    case 'heading_1':
      formatted.text = block.heading_1.rich_text.map(t => t.plain_text).join('');
      break;
    case 'heading_2':
      formatted.text = block.heading_2.rich_text.map(t => t.plain_text).join('');
      break;
    case 'heading_3':
      formatted.text = block.heading_3.rich_text.map(t => t.plain_text).join('');
      break;
    case 'bulleted_list_item':
      formatted.text = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
      break;
    case 'numbered_list_item':
      formatted.text = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
      break;
    case 'to_do':
      formatted.text = block.to_do.rich_text.map(t => t.plain_text).join('');
      formatted.checked = block.to_do.checked;
      break;
    case 'code':
      formatted.text = block.code.rich_text.map(t => t.plain_text).join('');
      formatted.language = block.code.language;
      break;
    case 'quote':
      formatted.text = block.quote.rich_text.map(t => t.plain_text).join('');
      break;
    case 'callout':
      formatted.text = block.callout.rich_text.map(t => t.plain_text).join('');
      formatted.icon = block.callout.icon;
      break;
    case 'image':
      formatted.url = block.image.type === 'external'
        ? block.image.external.url
        : block.image.file.url;
      formatted.caption = block.image.caption?.map(t => t.plain_text).join('') || '';
      break;
    default:
      formatted.text = `[${block.type} block]`;
  }

  return formatted;
}

/**
 * Remove a tag from a task's MCP multi-select property
 * @param {string} pageId - Notion page ID
 * @param {string} tagName - Tag to remove
 * @returns {Promise<void>}
 */
export async function removeTag(pageId, tagName) {
  return retryWithBackoff(async () => {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const currentTags = page.properties.MCP.multi_select;
    const updatedTags = currentTags.filter(t => t.name !== tagName);

    await notion.pages.update({
      page_id: pageId,
      properties: {
        MCP: { multi_select: updatedTags },
      },
    });
  });
}

/**
 * Add a comment to a Notion page
 * @param {string} pageId - Notion page ID
 * @param {string} comment - Comment text (markdown supported)
 * @returns {Promise<void>}
 */
export async function addComment(pageId, comment) {
  return retryWithBackoff(async () => {
    await notion.comments.create({
      parent: { page_id: pageId },
      rich_text: [{ type: 'text', text: { content: comment } }],
    });
  });
}

/**
 * Update task description (content property)
 * @param {string} pageId - Notion page ID
 * @param {string} description - New description
 * @returns {Promise<void>}
 */
export async function updateTaskDescription(pageId, description) {
  return retryWithBackoff(async () => {
    const page = await notion.pages.retrieve({ page_id: pageId });

    // Find the content property (could be "Description", "Content", or "Name")
    const properties = page.properties;
    const contentProp = properties.Description || properties.Content || properties.Name;

    if (!contentProp) {
      throw new Error('Could not find description property (tried: Description, Content, Name)');
    }

    const propertyName = Object.keys(properties).find(
      k => properties[k] === contentProp
    );

    await notion.pages.update({
      page_id: pageId,
      properties: {
        [propertyName]: {
          rich_text: [{ type: 'text', text: { content: description } }],
        },
      },
    });
  });
}

/**
 * Update task status
 * @param {string} pageId - Notion page ID
 * @param {string} status - New status (Ready, In Progress, Done)
 * @returns {Promise<void>}
 */
export async function updateTaskStatus(pageId, status) {
  return retryWithBackoff(async () => {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          status: { name: status },
        },
      },
    });
  });
}

/**
 * Append content to the page body (as new blocks)
 * @param {string} pageId - Notion page ID
 * @param {string} content - Content to append (will be converted to paragraph blocks)
 * @returns {Promise<void>}
 */
export async function appendToPageBody(pageId, content) {
  return retryWithBackoff(async () => {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    const children = paragraphs.map(para => ({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: para } }],
      },
    }));

    await notion.blocks.children.append({
      block_id: pageId,
      children,
    });
  });
}

/**
 * Format a Notion page into a task object
 * @param {object} page - Raw Notion page object
 * @returns {object} Formatted task object
 */
function formatTask(page) {
  return {
    id: page.id,
    url: page.url,
    title: extractTitle(page),
    description: extractDescription(page),
    status: extractStatus(page),
    priority: extractPriority(page),
    mcpTags: extractMcpTags(page),
    properties: page.properties,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

/**
 * Extract title from page properties
 */
function extractTitle(page) {
  const titleProp = Object.values(page.properties).find(p => p.type === 'title');
  if (!titleProp || !titleProp.title || titleProp.title.length === 0) {
    return 'Untitled';
  }
  return titleProp.title.map(t => t.plain_text).join('');
}

/**
 * Extract description from page properties
 */
function extractDescription(page) {
  const descProp = page.properties.Description || page.properties.Content;
  if (!descProp || !descProp.rich_text || descProp.rich_text.length === 0) {
    return '';
  }
  return descProp.rich_text.map(t => t.plain_text).join('');
}

/**
 * Extract status from page properties
 */
function extractStatus(page) {
  if (!page.properties.Status || !page.properties.Status.status) {
    return 'Unknown';
  }
  return page.properties.Status.status.name;
}

/**
 * Extract priority from page properties
 */
function extractPriority(page) {
  if (!page.properties.Priority || !page.properties.Priority.select) {
    return 'Medium';
  }
  return page.properties.Priority.select.name;
}

/**
 * Extract MCP tags from page properties
 */
function extractMcpTags(page) {
  if (!page.properties.MCP || !page.properties.MCP.multi_select) {
    return [];
  }
  return page.properties.MCP.multi_select.map(tag => tag.name);
}

/**
 * Extract full content from blocks as readable text
 * @param {Array} blocks - Array of Notion block objects
 * @returns {string} Full page content as text
 */
function extractFullContent(blocks) {
  if (!blocks || blocks.length === 0) {
    return '';
  }

  return blocks.map(block => {
    const formatted = formatBlock(block);

    switch (block.type) {
      case 'heading_1':
        return `# ${formatted.text}\n`;
      case 'heading_2':
        return `## ${formatted.text}\n`;
      case 'heading_3':
        return `### ${formatted.text}\n`;
      case 'bulleted_list_item':
        return `- ${formatted.text}`;
      case 'numbered_list_item':
        return `${formatted.text}`;
      case 'to_do':
        return `- [${formatted.checked ? 'x' : ' '}] ${formatted.text}`;
      case 'code':
        return `\`\`\`${formatted.language}\n${formatted.text}\n\`\`\`\n`;
      case 'quote':
        return `> ${formatted.text}\n`;
      case 'callout':
        return `**${formatted.text}**\n`;
      case 'image':
        return `![${formatted.caption}](${formatted.url})\n`;
      case 'paragraph':
        return formatted.text ? `${formatted.text}\n` : '';
      default:
        return formatted.text ? `${formatted.text}\n` : '';
    }
  }).join('\n');
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>} Result of function
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on last attempt
      if (i === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
