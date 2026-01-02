#!/usr/bin/env node

/**
 * taskflow-mcp
 *
 * MCP server for Notion task workflow automation with AI-powered tag processing.
 *
 * Leverages all 4 MCP capabilities:
 * - Tools: Direct task processing, querying, and updates
 * - Resources: Quick access to task lists
 * - Prompts: AI-powered task analysis workflows
 * - Sampling: LLM-powered tag processing
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import * as notionClient from './notion-client.js';
import { sortTagsByPriority, extractPersona, isValidMcpTag } from './utils/tag-manager.js';
import { downloadTaskImages } from './utils/image-downloader.js';

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

const server = new Server(
  {
    name: 'taskflow-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      sampling: {},
    },
  }
);

console.error('🚀 taskflow-mcp server starting...');

// ============================================================================
// TOOLS
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'process_tasks',
        description: 'Process all tasks with MCP tags. Processes tags in priority order: think like → interrogate → rewrite → estimate → expand → critique → user stories → to-do → code → confirm. Each tag triggers specific actions: interrogate/expand/critique/estimate/confirm add comments, rewrite updates description, user stories appends to description, to-do adds to todo list, code writes actual implementation. "code" is ONLY tag that writes code. Removes each tag after successful processing.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of tasks to process',
              default: 10,
            },
            dryRun: {
              type: 'boolean',
              description: 'Preview what would be processed without actually processing or removing tags',
              default: false,
            },
            specificTag: {
              type: 'string',
              enum: ['interrogate', 'expand', 'critique', 'user stories', 'rewrite', 'to-do', 'code'],
              description: 'Process only this specific tag type across all tasks',
            },
          },
        },
      },
      {
        name: 'query_tasks',
        description: 'Query tasks from Notion database',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['Ready', 'In Progress', 'Done'],
              description: 'Filter by task status',
            },
            hasMcpTags: {
              type: 'boolean',
              description: 'Only return tasks with MCP tags',
              default: true,
            },
          },
        },
      },
      {
        name: 'add_comment',
        description: 'Add a comment to a Notion task',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Notion page ID',
            },
            comment: {
              type: 'string',
              description: 'Comment text (markdown supported)',
            },
          },
          required: ['taskId', 'comment'],
        },
      },
      {
        name: 'update_task',
        description: 'Update task properties (description, status, or remove tags)',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Notion page ID',
            },
            description: {
              type: 'string',
              description: 'New task description',
            },
            status: {
              type: 'string',
              enum: ['Ready', 'In Progress', 'Done'],
              description: 'New task status',
            },
            removeTags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of MCP tag names to remove',
            },
          },
          required: ['taskId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'process_tasks': {
        const limit = args.limit || 10;
        const dryRun = args.dryRun || false;
        const specificTag = args.specificTag || null;

        const results = await processTasks(limit, dryRun, specificTag);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'query_tasks': {
        const status = args.status || null;
        const hasMcpTags = args.hasMcpTags !== false;

        const tasks = status
          ? await notionClient.queryTasksByStatus(status, hasMcpTags)
          : await notionClient.queryTasksWithMcpTags(100);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      }

      case 'add_comment': {
        await notionClient.addComment(args.taskId, args.comment);

        return {
          content: [
            {
              type: 'text',
              text: 'Comment added successfully',
            },
          ],
        };
      }

      case 'update_task': {
        if (args.description) {
          await notionClient.updateTaskDescription(args.taskId, args.description);
        }

        if (args.status) {
          await notionClient.updateTaskStatus(args.taskId, args.status);
        }

        if (args.removeTags && args.removeTags.length > 0) {
          for (const tag of args.removeTags) {
            await notionClient.removeTag(args.taskId, tag);
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Task updated successfully',
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// RESOURCES
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    // Get all tasks with MCP tags
    const tasks = await notionClient.queryTasksWithMcpTags(100);

    // Create resources for collections
    const collectionResources = [
      {
        uri: 'notion://tasks/ready',
        name: 'Ready Tasks with MCP Tags',
        description: 'All tasks in Ready status that have MCP tags for processing',
        mimeType: 'application/json',
      },
      {
        uri: 'notion://tasks/in-progress',
        name: 'In Progress Tasks with MCP Tags',
        description: 'All tasks currently In Progress that have MCP tags',
        mimeType: 'application/json',
      },
      {
        uri: 'notion://tasks/with-mcp-tags',
        name: 'All Tasks with MCP Tags',
        description: 'All tasks with MCP tags regardless of status',
        mimeType: 'application/json',
      },
    ];

    // Create resources for individual tasks
    const taskResources = tasks.map(task => ({
      uri: `notion://task/${task.id}`,
      name: task.title,
      description: `${task.status} | Tags: ${task.mcpTags.join(', ')} | ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`,
      mimeType: 'application/json',
    }));

    return {
      resources: [...collectionResources, ...taskResources],
    };
  } catch (error) {
    console.error('Error listing resources:', error);
    // Return at least the collection resources even if task listing fails
    return {
      resources: [
        {
          uri: 'notion://tasks/ready',
          name: 'Ready Tasks with MCP Tags',
          description: 'All tasks in Ready status that have MCP tags for processing',
          mimeType: 'application/json',
        },
        {
          uri: 'notion://tasks/in-progress',
          name: 'In Progress Tasks with MCP Tags',
          description: 'All tasks currently In Progress that have MCP tags',
          mimeType: 'application/json',
        },
        {
          uri: 'notion://tasks/with-mcp-tags',
          name: 'All Tasks with MCP Tags',
          description: 'All tasks with MCP tags regardless of status',
          mimeType: 'application/json',
        },
      ],
    };
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  try {
    let data;

    // Check if this is an individual task URI
    const taskMatch = uri.match(/^notion:\/\/task\/(.+)$/);
    if (taskMatch) {
      const taskId = taskMatch[1];
      data = await notionClient.getTaskWithBlocks(taskId);
    } else {
      // Handle collection URIs
      switch (uri) {
        case 'notion://tasks/ready':
          data = await notionClient.queryTasksByStatus('Ready', true);
          break;

        case 'notion://tasks/in-progress':
          data = await notionClient.queryTasksByStatus('In Progress', true);
          break;

        case 'notion://tasks/with-mcp-tags':
          data = await notionClient.queryTasksWithMcpTags(100);
          break;

        default:
          throw new Error(`Unknown resource URI: ${uri}`);
      }
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// ============================================================================
// PROMPTS
// ============================================================================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'interrogate_task',
        description: 'Ask meaningful clarifying questions about a task to better understand requirements, constraints, and success criteria',
        arguments: [
          {
            name: 'taskId',
            description: 'Notion page ID of the task to interrogate',
            required: true,
          },
        ],
      },
      {
        name: 'expand_task',
        description: 'Add technical detail to a task description including APIs, data structures, UI patterns, acceptance criteria, edge cases, and testing approach',
        arguments: [
          {
            name: 'taskId',
            description: 'Notion page ID of the task to expand',
            required: true,
          },
        ],
      },
      {
        name: 'critique_task',
        description: 'Provide constructive critique of a task identifying ambiguities, technical issues, and improvement suggestions',
        arguments: [
          {
            name: 'taskId',
            description: 'Notion page ID of the task to critique',
            required: true,
          },
          {
            name: 'persona',
            description: 'Optional persona to critique from (e.g., "security engineer", "UX lead")',
            required: false,
          },
        ],
      },
      {
        name: 'generate_user_stories',
        description: 'Generate user stories based on the task requirements',
        arguments: [
          {
            name: 'taskId',
            description: 'Notion page ID of the task',
            required: true,
          },
        ],
      },
      {
        name: 'rewrite_task',
        description: 'Rewrite task description for maximum clarity using structured format',
        arguments: [
          {
            name: 'taskId',
            description: 'Notion page ID of the task to rewrite',
            required: true,
          },
        ],
      },
      {
        name: 'estimate_task',
        description: 'Provide commentary on level of effort and refactoring needed for the task',
        arguments: [
          {
            name: 'taskId',
            description: 'Notion page ID of the task to estimate',
            required: true,
          },
        ],
      },
      {
        name: 'prepare_for_coding',
        description: 'Analyze task and prepare it for implementation. Reviews requirements, identifies files to change, and then starts coding',
        arguments: [
          {
            name: 'taskId',
            description: 'Notion page ID of the task marked for coding',
            required: true,
          },
        ],
      },
      {
        name: 'confirm_implementation',
        description: 'Verify that the task has been fully implemented and completed',
        arguments: [
          {
            name: 'taskId',
            description: 'Notion page ID of the task to verify',
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const task = await notionClient.getTask(args.taskId);
    const imagePaths = await downloadTaskImages(notionClient.notion, args.taskId);

    // Format task details for prompt
    const taskDetails = `
## Task: ${task.title}

**Status:** ${task.status}
**Priority:** ${task.priority}
**MCP Tags:** ${task.mcpTags.join(', ')}
**URL:** ${task.url}

**Description:**
${task.description || '(No description provided)'}

**Images:** ${imagePaths.length > 0 ? `${imagePaths.length} images downloaded to:\n${imagePaths.map(p => `- ${p}`).join('\n')}` : 'None'}
`.trim();

    let promptText = '';

    switch (name) {
      case 'interrogate_task': {
        promptText = `You are an AI assistant helping to clarify task requirements.

${taskDetails}

Your Job:
1. Read the task carefully (including any images if present)
2. Ask 3-5 meaningful, specific questions that would help clarify:
   - Success criteria
   - Technical constraints
   - User expectations
   - Integration points
   - Implementation approach
3. For each question, explain WHY you're asking it
4. Provide a brief critique of the current task description
5. **IMMEDIATELY save your analysis as a comment to this Notion task**

Format your response as:

## Questions
1. [Question] - **Why:** [Explanation]
2. [Question] - **Why:** [Explanation]
...

## Critique
[Your analysis of what's unclear, missing, or could be improved]

CRITICAL: After generating this analysis, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "interrogate" tag.

FEEDBACK TO USER: After saving the comment, provide thoughtful feedback explaining:
- What questions you asked and why they matter
- What gaps or ambiguities you identified in the task
- What the user should clarify before proceeding
- How this interrogation improves the task quality
- Next recommended steps (e.g., "expand the task after clarifying X")

DO NOT just say "Comment added." Explain the THINKING behind your analysis and its impact on the task.`;
        break;
      }

      case 'expand_task': {
        promptText = `You are an AI assistant helping to add detail to task descriptions.

${taskDetails}

Your Job:
1. Analyze what information is missing for successful implementation
2. Add technical details:
   - Specific APIs or libraries to use
   - Data structures and types
   - UI patterns and components
   - File paths and code locations
3. Include clear acceptance criteria
4. List potential edge cases to handle
5. Suggest testing approach
6. **IMMEDIATELY save your expanded description as a comment to this Notion task**

Return an EXPANDED task description that Claude Code can implement without ambiguity.

Format as a complete, detailed task description with sections for:
- Goal
- Technical Approach
- Acceptance Criteria
- Edge Cases
- Testing

CRITICAL: After generating this expansion, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "expand" tag.

FEEDBACK TO USER: After saving the comment, provide thoughtful feedback explaining:
- What technical details you added and why they're essential
- What was missing from the original task description
- How this expansion makes the task more implementable
- What risks or edge cases you identified
- What the next step should be (e.g., "ready for code tag" or "needs critique first")

DO NOT just say "Comment added." Explain your REASONING for the technical decisions and recommendations.`;
        break;
      }

      case 'critique_task': {
        const persona = args.persona;
        const personaPrefix = persona ? `You are ${persona}. Approach this task from that professional perspective.\n\n` : '';

        promptText = `${personaPrefix}${taskDetails}

Your Job:
1. Identify ambiguities or missing information
2. Spot potential technical issues or risks
3. Suggest improvements to the approach
4. Rate complexity (1-5, where 5 is most complex)
5. Estimate implementation steps
6. **IMMEDIATELY save your critique as a comment to this Notion task**

Be constructive and specific in your feedback. Focus on making this task successful.

Format your response as:

## Analysis
[Your professional assessment]

## Issues & Risks
- [List specific concerns]

## Suggested Improvements
- [Actionable suggestions]

## Complexity: [1-5]

## Implementation Steps
1. [Step]
2. [Step]
...

CRITICAL: After generating this critique, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "critique" tag.

FEEDBACK TO USER: After saving the comment, provide thoughtful feedback explaining:
- What issues or risks you identified (summarize key concerns)
- Why these issues matter for implementation success
- How your suggested improvements address the problems
- What the complexity rating means for planning
- Whether the task is ready to proceed or needs refinement

If a persona was used, explain how that perspective influenced your critique. DO NOT just say "Comment added." Share the KEY INSIGHTS from your analysis.`;
        break;
      }

      case 'generate_user_stories': {
        promptText = `Based on this task, generate user stories.

${taskDetails}

Your Job:
1. Generate 2-4 relevant user stories in the format:
   "As a [user type], I want [goal] so that [benefit]"
2. Consider different user perspectives and scenarios. Make stories specific and actionable.
3. **IMMEDIATELY append these user stories to the task description in Notion**

Format as:

## User Stories

1. **As a** [user type], **I want** [goal] **so that** [benefit]
   - Acceptance: [What does done look like?]

2. **As a** [user type], **I want** [goal] **so that** [benefit]
   - Acceptance: [What does done look like?]

...

CRITICAL: After generating these user stories, you MUST:
1. First, read the current task description
2. Then use the update_task tool to APPEND your user stories to the END of the existing description for task ID: ${args.taskId}
3. Do NOT replace the description - APPEND to it with "\n\n---\n\n" + your user stories
This is NOT optional - it is part of processing the "user stories" tag.

FEEDBACK TO USER: After updating the description, provide thoughtful feedback explaining:
- What user stories you generated and what perspectives they represent
- Why these specific stories capture the task requirements
- How these stories clarify acceptance criteria
- What user types or scenarios are covered
- How this helps implementation planning

DO NOT just say "Description updated." Explain the RATIONALE behind each user story and how they improve the task.`;
        break;
      }

      case 'rewrite_task': {
        promptText = `Rewrite this task for maximum clarity.

${taskDetails}

Your Job:
1. Use clear, actionable language
2. Structure with headings: Goal, Approach, Acceptance Criteria
3. Remove ambiguity
4. Keep it concise but complete
5. Make it implementable
6. **IMMEDIATELY update the task description in Notion with your rewrite**

Return a rewritten task description that's crystal clear.

Format as:

## Goal
[What we're trying to achieve and why]

## Approach
[How we'll do it - specific steps and technologies]

## Acceptance Criteria
- [Specific, testable criteria]
- [More criteria]

## Notes
[Any additional context or constraints]

CRITICAL: After generating this rewrite, you MUST use the update_task tool to REPLACE the task description with your new version for task ID: ${args.taskId}. This is NOT optional - it is part of processing the "rewrite" tag.

FEEDBACK TO USER: After updating the description, provide thoughtful feedback explaining:
- What was unclear or ambiguous in the original task
- How your rewrite improves clarity and implementability
- What structure you imposed (Goal, Approach, Acceptance Criteria, Notes)
- What assumptions you made or gaps you filled
- Why the task is now ready for the next step

DO NOT just say "Description updated." Explain the TRANSFORMATION you made and why it matters.`;
        break;
      }

      case 'prepare_for_coding': {
        promptText = `This task is marked for implementation. Review and prepare it for coding, then IMPLEMENT IT.

${taskDetails}

Your Job:
1. Verify all necessary information is present
2. List files that will likely need changes
3. Identify dependencies or blockers
4. Create a brief implementation checklist
5. **START IMPLEMENTING THE TASK IMMEDIATELY**

CRITICAL INSTRUCTIONS:
- The "code" tag is the ONLY tag that triggers implementation
- All other tags (interrogate, rewrite, expand, critique, user stories, to-do) are for analysis only
- After your brief analysis, you MUST proceed directly to implementation
- Use Read, Edit, Write, Bash tools to make the actual code changes
- This is NOT optional - the "code" tag means WRITE THE CODE NOW

Format your initial analysis as:

## Implementation Plan

**Files to Change:**
- [List specific file paths]

**Dependencies:**
- [Any blockers or prerequisites]

**Checklist:**
1. [Implementation step]
2. [Implementation step]
...

**Ready to code:** [Yes/No - explain if no]

MANDATORY: After providing this brief analysis, immediately use your available tools (Read, Edit, Write, Bash, etc.) to implement the task. Do NOT just analyze - you must write the actual code. Processing the "code" tag means IMPLEMENTING the feature, not just planning it.

FEEDBACK TO USER: During and after implementation, provide thoughtful feedback explaining:
- What files you're reading/modifying and why
- What implementation approach you chose and the reasoning behind it
- What challenges or decisions arose during coding
- What you accomplished and what remains (if blocked)
- How your implementation meets the acceptance criteria
- Any testing or verification performed

DO NOT just say "Implementation complete." Walk the user through your THOUGHT PROCESS as you code, explaining key decisions and trade-offs. If you encounter blockers, explain what you tried and why it didn't work.`;
        break;
      }

      case 'estimate_task': {
        promptText = `Provide an estimate of level of effort and refactoring needed for this task.

${taskDetails}

Your Job:
1. Assess the complexity and scope of the task
2. Estimate level of effort (Small, Medium, Large, Extra Large)
3. Identify any refactoring opportunities or technical debt
4. Note any architectural considerations
5. Suggest optimizations or improvements
6. Estimate time range (hours/days)
7. **IMMEDIATELY save your estimate as a comment to this Notion task**

Consider:
- Current codebase complexity
- Number of files/components affected
- Testing requirements
- Integration complexity
- Technical debt that could be addressed
- Potential refactoring opportunities

Format your response as:

## Effort Estimate

**Size:** [Small / Medium / Large / Extra Large]
**Time Range:** [X-Y hours / days]

## Scope Analysis
[What needs to be done]

## Refactoring Opportunities
- [Potential improvement 1]
- [Potential improvement 2]

## Technical Considerations
- [Architecture note 1]
- [Architecture note 2]

## Risks & Complexities
- [Risk or complexity 1]
- [Risk or complexity 2]

## Recommendation
[Suggested approach and priorities]

CRITICAL: After generating this estimate, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "estimate" tag.

FEEDBACK TO USER: After saving the comment, provide thoughtful feedback explaining:
- The estimated size and time range with justification
- Why this estimate is reasonable given the scope
- What factors could increase or decrease the effort
- What refactoring opportunities you identified and their value
- Whether this should be broken into smaller tasks

DO NOT just say "Comment added." Explain your REASONING behind the estimate and help the user make planning decisions.`;
        break;
      }

      case 'confirm_implementation': {
        promptText = `Verify that this task has been fully implemented and completed.

${taskDetails}

Your Job:
1. Review what the task was supposed to accomplish
2. Check if the implementation exists in the codebase
3. Verify all acceptance criteria are met
4. Identify any gaps or incomplete work
5. Confirm the implementation is production-ready
6. **IMMEDIATELY save your verification report as a comment to this Notion task**

Check for:
- Files that should have been created/modified exist
- Code follows the requirements
- Tests are written (if applicable)
- Documentation is updated (if needed)
- No obvious bugs or issues
- Acceptance criteria met

Format your response as:

## Implementation Status

**Status:** [Complete / Incomplete / Partially Complete]

## What Was Done
- [Accomplishment 1]
- [Accomplishment 2]

## Files Changed/Created
- [File path 1]
- [File path 2]

## Verification Checklist
- [✓] [Requirement 1 met]
- [✗] [Requirement 2 NOT met]
- [✓] [Requirement 3 met]

## Gaps / Missing Work
[List any incomplete items or issues found]

## Production Readiness
[Assessment of whether this is ready to ship]

## Recommendation
[Should this task be marked as Done? Or what needs to be finished?]

CRITICAL: After generating this verification report, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "confirm" tag.

FEEDBACK TO USER: After saving the comment, provide thoughtful feedback explaining:
- The implementation status (Complete/Incomplete/Partially Complete) with evidence
- What was successfully accomplished (highlight key achievements)
- What files were changed and why those changes matter
- Any gaps or incomplete work that needs attention
- Whether this task can be marked as Done or what blockers remain

DO NOT just say "Comment added." Give an EXECUTIVE SUMMARY of the implementation quality and readiness.`;
        break;
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  } catch (error) {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        },
      ],
    };
  }
});

// ============================================================================
// TAG PROCESSING LOGIC
// ============================================================================

/**
 * Process tasks with MCP tags
 */
async function processTasks(limit, dryRun, specificTag) {
  const tasks = await notionClient.queryTasksWithMcpTags(limit);

  if (tasks.length === 0) {
    return {
      success: true,
      message: 'No tasks with MCP tags found',
      tasksProcessed: 0,
    };
  }

  const results = [];

  for (const task of tasks) {
    let tagsToProcess = task.mcpTags;

    // Filter to specific tag if requested
    if (specificTag) {
      tagsToProcess = tagsToProcess.filter(t => t.toLowerCase() === specificTag.toLowerCase());
    }

    if (tagsToProcess.length === 0) {
      continue;
    }

    const sortedTags = sortTagsByPriority(tagsToProcess);
    let persona = null;
    const processedTags = [];

    for (const tag of sortedTags) {
      const tagLower = tag.toLowerCase().trim();

      try {
        // Handle "think like" persona extraction
        if (tagLower.startsWith('think like ')) {
          persona = extractPersona(tag);
          processedTags.push({
            tag,
            status: 'success',
            action: 'persona_set',
            persona,
          });

          if (!dryRun) {
            await notionClient.removeTag(task.id, tag);
          }
          continue;
        }

        // Process other tags
        const result = await processTag(task, tag, persona, dryRun);
        processedTags.push(result);

        if (!dryRun && result.status === 'success') {
          await notionClient.removeTag(task.id, tag);
        }
      } catch (error) {
        processedTags.push({
          tag,
          status: 'error',
          error: error.message,
        });
      }
    }

    results.push({
      taskId: task.id,
      title: task.title,
      url: task.url,
      processedTags,
    });
  }

  return {
    success: true,
    dryRun,
    tasksProcessed: results.length,
    results,
  };
}

/**
 * Process a single tag
 */
async function processTag(task, tag, persona, dryRun) {
  const tagLower = tag.toLowerCase().trim();

  // Map tag to prompt
  const promptMap = {
    'interrogate': 'interrogate_task',
    'expand': 'expand_task',
    'estimate': 'estimate_task',
    'critique': 'critique_task',
    'user stories': 'generate_user_stories',
    'rewrite': 'rewrite_task',
    'code': 'prepare_for_coding',
    'confirm': 'confirm_implementation',
  };

  const promptName = promptMap[tagLower];

  if (promptName) {
    return {
      tag,
      status: 'success',
      action: 'prompt_triggered',
      prompt: promptName,
      note: dryRun ? 'Would trigger prompt' : 'Prompt triggered - see MCP prompts',
      persona: persona || null,
    };
  }

  // Handle "to-do" tag
  if (tagLower === 'to-do') {
    return {
      tag,
      status: 'success',
      action: 'added_to_todo',
      note: dryRun ? 'Would add to todo list' : 'Add to todo list only - no implementation',
    };
  }

  // Unknown tag
  return {
    tag,
    status: 'skipped',
    note: 'Not a recognized MCP tag',
  };
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ taskflow-mcp server running');
}

main().catch((error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
