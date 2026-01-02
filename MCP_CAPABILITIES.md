# taskflow-mcp - MCP Capabilities Reference

Complete reference for all MCP capabilities provided by taskflow-mcp.

---

## Overview

taskflow-mcp implements all 4 MCP capabilities:

- **Tools** (4) - Direct function calls for task processing
- **Resources** (3) - URI-based access to task lists
- **Prompts** (6) - Guided AI-powered workflows
- **Sampling** - LLM analysis integrated via prompts

---

## Tools

Tools are direct function calls that perform specific actions.

### `process_tasks`

**Purpose:** Process all tasks with MCP tags. Main entry point for workflow automation.

**Input Schema:**
```json
{
  "limit": 10,           // Max tasks to process (default: 10)
  "dryRun": false,       // Preview without processing (default: false)
  "specificTag": null    // Process only this tag type (optional)
}
```

**Behavior:**
1. Queries Notion for tasks with MCP multi-select property
2. For each task:
   - Extracts all MCP tags
   - Sorts by priority order
   - Processes each tag sequentially
   - Removes tag after successful processing
3. Returns summary of processed tasks

**Priority Order:**
1. `think like [X]` - Set persona context
2. `interrogate` - Ask questions
3. `expand` - Add detail
4. `rewrite` - Rewrite description
5. `critique` - Provide feedback
6. `user stories` - Generate stories
7. `to-do` - Add to todo list
8. `code` - Trigger implementation

**Example Usage:**
```
Process all my Notion tasks
```

Or with parameters:
```javascript
{
  "tool": "process_tasks",
  "arguments": {
    "limit": 5,
    "dryRun": true,
    "specificTag": "interrogate"
  }
}
```

**Response:**
```json
{
  "success": true,
  "dryRun": false,
  "tasksProcessed": 3,
  "results": [
    {
      "taskId": "abc123...",
      "title": "Add user authentication",
      "url": "https://notion.so/...",
      "processedTags": [
        {
          "tag": "interrogate",
          "status": "success",
          "action": "prompt_triggered",
          "prompt": "interrogate_task"
        },
        {
          "tag": "expand",
          "status": "success",
          "action": "prompt_triggered",
          "prompt": "expand_task"
        }
      ]
    }
  ]
}
```

---

### `query_tasks`

**Purpose:** Query and list tasks from Notion database.

**Input Schema:**
```json
{
  "status": null,        // Filter by status (Ready, In Progress, Done)
  "hasMcpTags": true     // Only tasks with MCP tags (default: true)
}
```

**Example Usage:**
```
Show me all Ready tasks with MCP tags
```

Or:
```javascript
{
  "tool": "query_tasks",
  "arguments": {
    "status": "In Progress",
    "hasMcpTags": true
  }
}
```

**Response:**
```json
[
  {
    "id": "abc123...",
    "url": "https://notion.so/...",
    "title": "Add dark mode",
    "description": "Implement dark mode toggle...",
    "status": "Ready",
    "priority": "High",
    "mcpTags": ["interrogate", "code"],
    "createdTime": "2025-01-01T00:00:00.000Z",
    "lastEditedTime": "2025-01-01T12:00:00.000Z"
  }
]
```

---

### `add_comment`

**Purpose:** Add a comment to a Notion task.

**Input Schema:**
```json
{
  "taskId": "string",    // Notion page ID (required)
  "comment": "string"    // Comment text, markdown supported (required)
}
```

**Example Usage:**
```javascript
{
  "tool": "add_comment",
  "arguments": {
    "taskId": "abc123def456",
    "comment": "## Analysis\n\nThis task requires...\n\n- Point 1\n- Point 2"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Comment added successfully"
    }
  ]
}
```

---

### `update_task`

**Purpose:** Update task properties (description, status, or remove tags).

**Input Schema:**
```json
{
  "taskId": "string",              // Notion page ID (required)
  "description": "string",         // New description (optional)
  "status": "string",              // New status (optional)
  "removeTags": ["string"]         // Tags to remove (optional)
}
```

**Example Usage:**
```javascript
{
  "tool": "update_task",
  "arguments": {
    "taskId": "abc123def456",
    "status": "In Progress",
    "removeTags": ["interrogate"]
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Task updated successfully"
    }
  ]
}
```

---

## Resources

Resources provide URI-based access to data. Use them for quick inspection of task lists.

### `notion://tasks/ready`

**Description:** All tasks in "Ready" status with MCP tags

**MIME Type:** `application/json`

**Usage:**
```
Show me notion://tasks/ready
```

**Returns:** JSON array of tasks with status="Ready" and MCP tags present

---

### `notion://tasks/in-progress`

**Description:** All tasks in "In Progress" status with MCP tags

**MIME Type:** `application/json`

**Usage:**
```
Show me notion://tasks/in-progress
```

**Returns:** JSON array of tasks with status="In Progress" and MCP tags present

---

### `notion://tasks/with-mcp-tags`

**Description:** All tasks with MCP tags regardless of status

**MIME Type:** `application/json`

**Usage:**
```
Show me notion://tasks/with-mcp-tags
```

**Returns:** JSON array of all tasks that have at least one MCP tag

---

## Prompts

Prompts are guided workflows that leverage Sampling for AI-powered analysis. Each prompt returns a structured analysis that can be saved back to Notion.

### `interrogate_task`

**Purpose:** Ask meaningful clarifying questions to better understand task requirements.

**Arguments:**
```json
{
  "taskId": "string"  // Notion page ID (required)
}
```

**Behavior:**
1. Retrieves task details from Notion
2. Downloads any images for vision analysis
3. Generates 3-5 specific questions about:
   - Success criteria
   - Technical constraints
   - User expectations
   - Integration points
4. Provides brief critique
5. Returns formatted Q&A

**Usage:**
```
Interrogate task abc123def456
```

Or:
```
Run interrogate_task for my authentication task
```

**Output Format:**
```markdown
## Questions

1. [Question] - **Why:** [Explanation]
2. [Question] - **Why:** [Explanation]
3. [Question] - **Why:** [Explanation]

## Critique

[Analysis of what's unclear, missing, or could be improved]
```

**After prompt:** Save output as comment using `add_comment` tool

---

### `expand_task`

**Purpose:** Add technical detail to make task implementable without ambiguity.

**Arguments:**
```json
{
  "taskId": "string"  // Notion page ID (required)
}
```

**Behavior:**
1. Analyzes current task description
2. Identifies missing information
3. Adds:
   - Specific APIs/libraries
   - Data structures
   - UI patterns
   - File paths
   - Acceptance criteria
   - Edge cases
   - Testing approach

**Usage:**
```
Expand task abc123def456
```

**Output Format:**
```markdown
## Goal
[What we're achieving and why]

## Technical Approach
[Specific technologies, APIs, patterns]

## Acceptance Criteria
- [Testable criterion]
- [Another criterion]

## Edge Cases
- [Case to handle]

## Testing
[Testing strategy]
```

---

### `critique_task`

**Purpose:** Provide constructive feedback identifying issues and suggesting improvements.

**Arguments:**
```json
{
  "taskId": "string",    // Notion page ID (required)
  "persona": "string"    // Optional persona (e.g., "security engineer")
}
```

**Behavior:**
1. Reviews task from specified perspective
2. Identifies ambiguities and risks
3. Suggests improvements
4. Rates complexity (1-5)
5. Estimates implementation steps

**Usage:**
```
Critique task abc123def456
```

Or with persona:
```
Critique task abc123def456 as a security engineer
```

**Output Format:**
```markdown
## Analysis
[Professional assessment]

## Issues & Risks
- [Specific concern]
- [Another risk]

## Suggested Improvements
- [Actionable suggestion]
- [Another improvement]

## Complexity: 4/5

## Implementation Steps
1. [Step]
2. [Step]
```

---

### `generate_user_stories`

**Purpose:** Generate user stories based on task requirements.

**Arguments:**
```json
{
  "taskId": "string"  // Notion page ID (required)
}
```

**Behavior:**
1. Analyzes task requirements
2. Generates 2-4 user stories
3. Adds acceptance criteria for each
4. Considers different user perspectives

**Usage:**
```
Generate user stories for task abc123def456
```

**Output Format:**
```markdown
## User Stories

1. **As a** [user type], **I want** [goal] **so that** [benefit]
   - Acceptance: [What does done look like?]

2. **As a** [user type], **I want** [goal] **so that** [benefit]
   - Acceptance: [What does done look like?]
```

---

### `rewrite_task`

**Purpose:** Rewrite task description for maximum clarity.

**Arguments:**
```json
{
  "taskId": "string"  // Notion page ID (required)
}
```

**Behavior:**
1. Analyzes current description
2. Rewrites with clear structure
3. Removes ambiguity
4. Uses actionable language

**Usage:**
```
Rewrite task abc123def456
```

**Output Format:**
```markdown
## Goal
[Clear objective and rationale]

## Approach
[Specific implementation steps]

## Acceptance Criteria
- [Criterion]
- [Criterion]

## Notes
[Additional context]
```

**After prompt:** Use `update_task` to replace description

---

### `prepare_for_coding`

**Purpose:** Analyze task and prepare for implementation. Then start coding.

**Arguments:**
```json
{
  "taskId": "string"  // Notion page ID (required)
}
```

**Behavior:**
1. Verifies all information is present
2. Lists files to change
3. Identifies dependencies/blockers
4. Creates implementation checklist
5. **Starts implementing** if ready

**Usage:**
```
Prepare task abc123def456 for coding
```

Or triggered automatically:
```
Process my Notion tasks  # Tasks with "code" tag trigger this prompt
```

**Output Format:**
```markdown
## Implementation Plan

**Files to Change:**
- [Specific file path]
- [Another file]

**Dependencies:**
- [Blocker or prerequisite]

**Checklist:**
1. [Implementation step]
2. [Implementation step]

**Ready to code:** Yes

[Proceeds with implementation]
```

---

## Sampling

Sampling is LLM-powered analysis integrated into prompts. When you invoke a prompt, Claude processes it via Sampling and returns intelligent, context-aware analysis.

**How it works:**
1. Prompt invoked with task data
2. Task details, images, and context provided to LLM
3. Claude analyzes via Sampling
4. Structured response returned
5. Response saved back to Notion (via `add_comment` or `update_task`)

**All 6 prompts use Sampling** - there's no separate Sampling API to call directly.

---

## Workflow Examples

### Example 1: Requirements Gathering

**Tags:** `interrogate`, `expand`, `user stories`

```bash
# In Claude Code:
"Process my Notion tasks"

# Result:
1. interrogate_task → Asks questions → Saves as comment
2. expand_task → Adds detail → Saves as comment
3. generate_user_stories → Creates stories → Saves as comment
4. All three tags removed
```

---

### Example 2: Expert Review

**Tags:** `think like a security engineer`, `critique`, `expand`

```bash
# In Claude Code:
"Process my Notion tasks"

# Result:
1. Sets persona: "security engineer"
2. critique_task (with security context) → Saves critique
3. expand_task (with security context) → Adds security details
4. All tags removed
```

---

### Example 3: Full Implementation

**Tags:** `interrogate`, `expand`, `code`

```bash
# In Claude Code:
"Process my Notion tasks"

# Result:
1. interrogate_task → Gathers requirements
2. expand_task → Adds technical detail
3. prepare_for_coding → Analyzes and starts implementing
4. All tags removed (implementation continues)
```

---

## Integration Patterns

### Pattern: Manual Prompt Invocation

```
Interrogate my authentication task
Expand my payment processing task
Critique my API design task as a senior architect
```

### Pattern: Batch Processing

```
Process all my Ready tasks in Notion
Process my Notion tasks with limit 3
Process only interrogate tags across all tasks
```

### Pattern: Resource Inspection

```
Show me notion://tasks/ready
List all tasks with MCP tags
What tasks are in progress with MCP tags?
```

### Pattern: Direct Tool Usage

```javascript
// Add comment
{
  "tool": "add_comment",
  "arguments": {
    "taskId": "abc123",
    "comment": "Additional notes..."
  }
}

// Update status
{
  "tool": "update_task",
  "arguments": {
    "taskId": "abc123",
    "status": "In Progress"
  }
}
```

---

## Best Practices

### 1. Use Tag Combinations Strategically

**Good:**
- `interrogate` → `expand` → `code` (full workflow)
- `think like X` → `critique` → `expand` (expert review)

**Less useful:**
- `code` only (might miss context)
- Too many tags at once (overwhelming)

### 2. Leverage Personas

Add "think like" tags for domain-specific analysis:
- `think like a security engineer` - Security focus
- `think like a UX lead` - User experience focus
- `think like a DevOps expert` - Infrastructure focus

### 3. Use Dry-Run for Planning

```
Process my tasks in dry-run mode
```

Preview what would happen without making changes.

### 4. Process Specific Tags

```
Process only interrogate tags
Process only code tags
```

Focus on one type of analysis at a time.

### 5. Save Prompt Results

After each prompt, save the output:
- **interrogate, expand, critique, user stories** → `add_comment`
- **rewrite** → `update_task` with new description

---

## API Reference Summary

| Capability | Count | Names |
|------------|-------|-------|
| **Tools** | 4 | process_tasks, query_tasks, add_comment, update_task |
| **Resources** | 3 | notion://tasks/ready, in-progress, with-mcp-tags |
| **Prompts** | 6 | interrogate_task, expand_task, critique_task, generate_user_stories, rewrite_task, prepare_for_coding |
| **Sampling** | ✓ | Integrated in all prompts |

---

## Error Handling

All tools and prompts include error handling. Common errors:

| Error | Cause | Solution |
|-------|-------|----------|
| "No .env file found" | Missing configuration | Create .env with NOTION_TOKEN and NOTION_DATABASE_ID |
| "Property MCP does not exist" | Database missing MCP property | Add multi-select property called "MCP" to database |
| "Could not reach database" | Integration not connected | Share database with integration in Notion |
| "Page not found" | Invalid task ID | Verify task ID is correct |

---

**For more examples and setup instructions, see [SETUP.md](./SETUP.md)**
