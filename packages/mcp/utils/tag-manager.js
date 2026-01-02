/**
 * Tag Manager
 *
 * Handles MCP tag priority sorting and processing logic.
 */

/**
 * MCP tag processing priority order
 */
const TAG_PRIORITY = {
  // Phase 1: Context Setting
  'think like': 1,

  // Phase 2: Task Refinement
  'interrogate': 2,
  'rewrite': 3,
  'expand': 4,
  'critique': 5,
  'user stories': 6,

  // Phase 3: Action
  'to-do': 7,
  'code': 8,
};

/**
 * Sort tags by processing priority
 * "think like" tags always come first, then others in priority order
 *
 * @param {string[]} tags - Array of MCP tags
 * @returns {string[]} Sorted tags by priority
 */
export function sortTagsByPriority(tags) {
  return tags.sort((a, b) => {
    const aPriority = getTagPriority(a);
    const bPriority = getTagPriority(b);
    return aPriority - bPriority;
  });
}

/**
 * Get priority number for a tag
 * @param {string} tag - Tag name
 * @returns {number} Priority (lower = earlier)
 */
function getTagPriority(tag) {
  const normalizedTag = tag.toLowerCase().trim();

  // Handle "think like X" pattern
  if (normalizedTag.startsWith('think like ')) {
    return TAG_PRIORITY['think like'];
  }

  // Find exact match
  for (const [key, priority] of Object.entries(TAG_PRIORITY)) {
    if (normalizedTag === key) {
      return priority;
    }
  }

  // Unknown tags go to end
  return 999;
}

/**
 * Extract persona from "think like X" tag
 * @param {string} tag - Tag name
 * @returns {string|null} Persona or null if not a "think like" tag
 */
export function extractPersona(tag) {
  const normalizedTag = tag.toLowerCase().trim();

  if (normalizedTag.startsWith('think like ')) {
    return tag.replace(/^think like /i, '').trim();
  }

  return null;
}

/**
 * Get processing function name for a tag
 * @param {string} tag - Tag name
 * @returns {string|null} Processor function name or null if no processor
 */
export function getProcessorForTag(tag) {
  const normalizedTag = tag.toLowerCase().trim();

  if (normalizedTag.startsWith('think like ')) {
    return 'think-like';
  }

  const processors = {
    'interrogate': 'interrogate',
    'expand': 'expand',
    'rewrite': 'rewrite',
    'critique': 'critique',
    'user stories': 'user-stories',
    'to-do': 'todo',
    'code': 'code',
  };

  return processors[normalizedTag] || null;
}

/**
 * Check if tag is recognized as a valid MCP tag
 * @param {string} tag - Tag name
 * @returns {boolean} True if valid MCP tag
 */
export function isValidMcpTag(tag) {
  const normalizedTag = tag.toLowerCase().trim();

  if (normalizedTag.startsWith('think like ')) {
    return true;
  }

  return getProcessorForTag(tag) !== null;
}
