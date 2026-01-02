# MCP Tag Processing: Improved AI Action Directives

## Overview

Updated all MCP prompt templates to **strongly encourage immediate action** using the **"Description is Logic"** philosophy. Each prompt now contains:

1. **Executable instructions** (not passive suggestions)
2. **Explicit tool requirements** (MUST use add_comment, update_task, etc.)
3. **Clear examples** of expected actions
4. **Mandatory language** ("CRITICAL", "NOT optional", "you MUST")

---

## Changes Made

### 1. **interrogate_task** Prompt

#### Before:
```
After you provide this analysis, I will save it as a comment on the task.
```

#### After:
```
5. **IMMEDIATELY save your analysis as a comment to this Notion task**

CRITICAL: After generating this analysis, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "interrogate" tag.
```

**Description is Logic Applied:**
- Explicit action verb: "IMMEDIATELY save"
- Tool requirement: "you MUST use the add_comment tool"
- Context: "This is NOT optional - it is part of processing"
- Parameter guidance: Includes actual task ID for copy-paste

---

### 2. **expand_task** Prompt

#### Before:
```
After you provide this expansion, I will save it as a comment on the task.
```

#### After:
```
6. **IMMEDIATELY save your expanded description as a comment to this Notion task**

CRITICAL: After generating this expansion, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "expand" tag.
```

**Description is Logic Applied:**
- Action is step 6 in the job list (part of workflow)
- Explicit tool name and parameter
- Mandatory language removes ambiguity

---

### 3. **critique_task** Prompt

#### Before:
```
After you provide this critique, I will save it as a comment on the task.
```

#### After:
```
6. **IMMEDIATELY save your critique as a comment to this Notion task**

CRITICAL: After generating this critique, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "critique" tag.
```

**Description is Logic Applied:**
- Persona context preserved and emphasized
- Tool usage becomes part of job definition
- No room for interpretation: "MUST use"

---

### 4. **estimate_task** Prompt

#### Before:
```
After you provide this estimate, I will save it as a comment on the task.
```

#### After:
```
7. **IMMEDIATELY save your estimate as a comment to this Notion task**

CRITICAL: After generating this estimate, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "estimate" tag.
```

**Description is Logic Applied:**
- Action integrated into numbered job list (step 7)
- Explicit consequence: "part of processing the tag"
- Removes passive voice ("I will save" → "you MUST use")

---

### 5. **confirm_implementation** Prompt

#### Before:
```
After you provide this verification, I will save it as a comment on the task.
```

#### After:
```
6. **IMMEDIATELY save your verification report as a comment to this Notion task**

CRITICAL: After generating this verification report, you MUST use the add_comment tool to save it to the Notion task (ID: ${args.taskId}). This is NOT optional - it is part of processing the "confirm" tag.
```

**Description is Logic Applied:**
- Verification is both analysis AND action
- Tool requirement explicit
- Ties action to tag processing flow

---

### 6. **generate_user_stories** Prompt

#### Before:
```
After you provide these user stories, I will APPEND them to the end of the task description.
```

#### After:
```
3. **IMMEDIATELY append these user stories to the task description in Notion**

CRITICAL: After generating these user stories, you MUST:
1. First, read the current task description
2. Then use the update_task tool to APPEND your user stories to the END of the existing description for task ID: ${args.taskId}
3. Do NOT replace the description - APPEND to it with "\n\n---\n\n" + your user stories
This is NOT optional - it is part of processing the "user stories" tag.
```

**Description is Logic Applied:**
- **Multi-step process** broken down (read → append → format)
- **Anti-pattern warning**: "Do NOT replace"
- **Format specification**: Exact separator string provided
- **Sequential logic**: Numbered steps ensure order

---

### 7. **rewrite_task** Prompt

#### Before:
```
After you provide this rewrite, I will update the task description.
```

#### After:
```
6. **IMMEDIATELY update the task description in Notion with your rewrite**

CRITICAL: After generating this rewrite, you MUST use the update_task tool to REPLACE the task description with your new version for task ID: ${args.taskId}. This is NOT optional - it is part of processing the "rewrite" tag.
```

**Description is Logic Applied:**
- Explicit verb: "REPLACE" (not "update" or "save")
- Contrast with user stories (REPLACE vs APPEND)
- Tool parameter explicitly named

---

### 8. **prepare_for_coding** Prompt (MOST CRITICAL)

#### Before:
```
5. **THEN: Start implementing the task**

After your analysis of this "code" tagged task, you should proceed directly to implementation using available tools.

After providing this analysis, proceed with implementation if ready.
```

#### After:
```
5. **START IMPLEMENTING THE TASK IMMEDIATELY**

CRITICAL INSTRUCTIONS:
- The "code" tag is the ONLY tag that triggers implementation
- All other tags (interrogate, rewrite, expand, critique, user stories, to-do) are for analysis only
- After your brief analysis, you MUST proceed directly to implementation
- Use Read, Edit, Write, Bash tools to make the actual code changes
- This is NOT optional - the "code" tag means WRITE THE CODE NOW

MANDATORY: After providing this brief analysis, immediately use your available tools (Read, Edit, Write, Bash, etc.) to implement the task. Do NOT just analyze - you must write the actual code. Processing the "code" tag means IMPLEMENTING the feature, not just planning it.
```

**Description is Logic Applied:**
- **Exclusive behavior**: "ONLY tag that triggers implementation"
- **Tool enumeration**: Lists specific tools to use
- **Anti-pattern**: "Do NOT just analyze"
- **Semantic clarity**: "WRITE THE CODE NOW" vs vague "implement"
- **Mandatory language**: Multiple reinforcements

---

## Tool Description Updates

### process_tasks Tool

#### Before:
```
Processes tags in priority order: think like → interrogate → rewrite → estimate → expand → critique → user stories → to-do → code → confirm. Only "code" tag triggers implementation. "confirm" verifies implementation is complete. Removes each tag after successful processing.
```

#### After:
```
Processes tags in priority order: think like → interrogate → rewrite → estimate → expand → critique → user stories → to-do → code → confirm. Each tag triggers specific actions: interrogate/expand/critique/estimate/confirm add comments, rewrite updates description, user stories appends to description, to-do adds to todo list, code writes actual implementation. "code" is ONLY tag that writes code. Removes each tag after successful processing.
```

**Description is Logic Applied:**
- **Action mapping**: Explicit tool actions per tag
- **Disambiguation**: "writes actual implementation" vs "triggers"
- **Exhaustive listing**: Every tag's behavior documented
- **Exclusive operator**: "ONLY tag that writes code"

---

## Documentation Updates

### README.md - AI-Powered Workflows Section

#### Before:
```
### AI-Powered Workflows
- **interrogate** - Claude asks clarifying questions about requirements
- **expand** - Adds technical detail, APIs, edge cases, testing approach
```

#### After:
```
### AI-Powered Workflows (with Automatic Actions)
- **interrogate** - Claude asks clarifying questions → **Saves as comment**
- **expand** - Adds technical detail, APIs, edge cases → **Saves as comment**
- **rewrite** - Rewrites task for clarity → **Updates task description**
- **estimate** - Estimates effort and refactoring → **Saves as comment**
- **critique** - Provides constructive feedback → **Saves as comment**
- **user stories** - Generates user stories → **Appends to description**
- **to-do** - Adds to todo list → **No code written**
- **code** - **Actually implements the feature (WRITES CODE)**
- **confirm** - Verifies implementation complete → **Saves verification as comment**
```

**Description is Logic Applied:**
- **Action → Outcome** format (verb → result)
- **Visual hierarchy**: Bold for actions
- **Contrasts**: "No code written" vs "WRITES CODE"
- **Completeness**: All 10 tags documented

---

### MCP_CAPABILITIES.md - New Required Actions Table

Added comprehensive table:

```markdown
## Required Actions per Tag

Each MCP tag requires the AI to perform specific actions. These are NOT optional:

| Tag | Required Action | Tool to Use | Details |
|-----|----------------|-------------|---------|
| `interrogate` | Add comment | `add_comment` | Save questions and critique as comment |
| `expand` | Add comment | `add_comment` | Save expanded description as comment |
| `critique` | Add comment | `add_comment` | Save critique analysis as comment |
| `estimate` | Add comment | `add_comment` | Save effort estimate as comment |
| `confirm` | Add comment | `add_comment` | Save verification report as comment |
| `rewrite` | Update description | `update_task` | REPLACE task description with rewrite |
| `user stories` | Append to description | `update_task` | APPEND user stories to existing description |
| `to-do` | Add to todo list | Built-in | Add task to Claude Code's todo tracker |
| `code` | **Write code** | Read/Edit/Write/Bash | **Actually implement the feature** |
| `think like [X]` | Set context | None | Store persona for subsequent tags |

**CRITICAL:** The prompts explicitly instruct the AI to perform these actions...
```

**Description is Logic Applied:**
- **Tabular reference**: Quick lookup for AI agents
- **Tool mapping**: Explicit tool names
- **Action verbs**: REPLACE vs APPEND vs Add
- **Emphasis hierarchy**: Bold for code tag
- **Meta-documentation**: Explains why this matters

---

### Usage Examples Enhancement

All three examples now show **action flow**:

```markdown
1. **interrogate** → Claude asks... → **Saves as comment**
2. **expand** → Adds technical detail... → **Saves as comment**
3. **code** → Reviews requirements → **WRITES THE ACTUAL CODE**
4. All tags removed after processing
5. Feature is fully implemented - not just analyzed
```

**Description is Logic Applied:**
- **Sequential numbering**: Clear order
- **Arrow notation**: Cause → effect
- **Outcome emphasis**: Bold for actions taken
- **Reality check**: "not just analyzed" prevents confusion

---

## "Description is Logic" Principles Applied

### 1. **Executable Instructions**
Every prompt now contains step-by-step instructions that an AI can follow WITHOUT human interpretation:
- "Use the add_comment tool"
- "APPEND to the END of the existing description"
- "Use Read, Edit, Write, Bash tools"

### 2. **Anti-Patterns Documented**
Prompts explicitly state what NOT to do:
- "Do NOT replace the description - APPEND"
- "Do NOT just analyze - write the actual code"
- "All other tags are for analysis only"

### 3. **Contextual "Why"**
Every instruction explains its purpose:
- "This is NOT optional - it is part of processing the tag"
- "The 'code' tag is the ONLY tag that triggers implementation"
- "Processing the 'code' tag means IMPLEMENTING the feature"

### 4. **Tool Parameter Clarity**
Prompts include actual parameter values:
- `(ID: ${args.taskId})`
- `for task ID: ${args.taskId}`
- `"\n\n---\n\n" + your user stories`

### 5. **Validation Rules Embedded**
Descriptions contain validation logic:
- "MUST use the add_comment tool"
- "you MUST proceed directly to implementation"
- "Removes each tag after successful processing"

### 6. **Discoverability**
Documentation structured for AI consumption:
- Tables with explicit Tool/Action mappings
- Bullet lists with action → outcome format
- Priority order documented in multiple places

### 7. **Examples and Anti-Examples**
- Examples: "interrogate → Saves as comment"
- Anti-examples: "not just analyzed"
- Contrast: "No code written" vs "WRITES CODE"

### 8. **Self-Documenting Behavior**
The tool description itself explains what each tag does:
```
interrogate/expand/critique/estimate/confirm add comments,
rewrite updates description,
user stories appends to description,
to-do adds to todo list,
code writes actual implementation
```

---

## Expected Behavior Change

### Before These Changes:
❌ AI generates analysis → waits for user to ask "can you save this?"
❌ AI says "I'll implement this" → describes implementation plan only
❌ AI completes tag processing → user manually adds comments

### After These Changes:
✅ AI generates analysis → **immediately uses add_comment tool**
✅ AI sees "code" tag → **actually writes code files**
✅ AI processes "user stories" → **appends to description automatically**
✅ AI processes "rewrite" → **replaces description immediately**

---

## Testing Recommendations

1. **Tag a task with**: `interrogate`, `expand`, `code`
2. **Run**: `process_tasks`
3. **Expected outcome**:
   - Interrogate analysis appears as **Notion comment**
   - Expand analysis appears as **Notion comment**
   - Code is **actually written** (files created/edited)
   - All three tags **removed** from task

4. **Verify**:
   - Check Notion task for 2 new comments
   - Check codebase for new/modified files
   - Check task has 0 MCP tags remaining

---

## New Feedback Directives (Thoughtful Analysis Required)

### The Problem
Previously, after executing MCP tool calls, the AI would simply return:
- "Comment added successfully"
- "Description updated"
- Raw JSON results

This lacked **context** and **reasoning** - the user didn't understand:
- What was accomplished and why
- What insights the AI discovered
- What should happen next
- How this action improved the task

### The Solution: "FEEDBACK TO USER" Sections

Every prompt now includes a **FEEDBACK TO USER** directive that requires the AI to provide thoughtful analysis after taking action.

---

### Feedback Directive Structure

Each prompt now ends with:

```
FEEDBACK TO USER: After [ACTION], provide thoughtful feedback explaining:
- [Key insight 1]
- [Key insight 2]
- [Decision rationale]
- [Impact assessment]
- [Next steps recommendation]

DO NOT just say "[ACTION] completed." Explain the THINKING behind your [analysis/implementation] and its impact.
```

---

### Examples by Tag

#### 1. **interrogate** Feedback

**Before:**
```
Comment added successfully.
```

**After (Required):**
```
I've added 5 clarifying questions to the task as a comment. Here's what I identified:

**Key Questions:**
1. Auth method (OAuth vs JWT) - This fundamentally changes the architecture
2. Session storage (localStorage vs httpOnly cookies) - Security vs convenience trade-off
3. Token refresh strategy - Affects user experience on expiration

**Critical Gaps:**
- No mention of password requirements (OWASP compliance needed)
- Unclear if MFA is required
- Missing error handling for failed login attempts

**Why This Matters:**
Without clarifying these points, implementation could go in the wrong direction. The auth method choice affects database schema, API design, and frontend architecture.

**Next Steps:**
After the user answers these questions, add the "expand" tag to create detailed technical specs. Don't proceed to "code" tag yet - we need more clarity first.
```

**Why This Works:**
- Shows reasoning behind each question
- Identifies specific risks
- Guides user on next actions
- Demonstrates understanding of dependencies

---

#### 2. **expand** Feedback

**Before:**
```
Comment added successfully.
```

**After (Required):**
```
I've expanded the task with comprehensive technical detail. Here's what was added:

**Technical Decisions:**
- Chose JWT over sessions for stateless auth (better for microservices)
- Specified bcrypt with salt rounds 12 for password hashing
- Recommended httpOnly cookies for token storage (XSS protection)

**What Was Missing:**
- No API endpoints specified → added /auth/login, /auth/refresh, /auth/logout
- No error handling → defined 401/403/429 response codes
- No token expiration → set 15min access, 7day refresh

**Edge Cases Identified:**
- Concurrent logins from multiple devices
- Token refresh race conditions
- Password reset flow security

**Implementation Readiness:**
This task is now 80% ready for coding. The remaining 20% is deciding on the frontend framework integration. Once that's confirmed, add the "code" tag.

**Risk Assessment:**
Medium complexity. Main risk is token refresh logic - needs careful testing.
```

**Why This Works:**
- Explains technical choices with rationale
- Shows what gaps were filled
- Assesses readiness quantitatively
- Identifies remaining blockers

---

#### 3. **code** Feedback (Most Critical)

**Before:**
```
Implementation complete.
```

**After (Required):**
```
I've implemented the authentication system. Here's my thought process:

**Files Modified:**
1. `src/auth/AuthService.ts` - Created JWT generation/validation logic
   - Why: Centralized auth logic prevents duplication
   - Key decision: Used jose library instead of jsonwebtoken (better TypeScript support)

2. `src/api/auth/login.ts` - Login endpoint
   - Why: Separated from main API for security isolation
   - Challenge: Rate limiting needed - implemented token bucket algorithm

3. `src/middleware/auth.ts` - Auth middleware
   - Why: DRY principle - applies to all protected routes
   - Trade-off: Adds latency (~5ms) but worth it for security

**Implementation Approach:**
Started with backend (API + DB schema) before frontend because auth contracts must be stable. Frontend can't work without working auth endpoints.

**Challenges Encountered:**
1. Token refresh timing - solved by adding 30s buffer before expiration
2. TypeScript types for JWT payload - created AuthTokenPayload interface
3. Cookie security flags - enabled SameSite=Strict and Secure

**Acceptance Criteria Met:**
✅ User can log in with email/password
✅ Tokens expire after 15 minutes
✅ Refresh tokens work without re-login
✅ Passwords are hashed with bcrypt
✅ Protected routes require valid token

**What Remains:**
- Frontend login form (blocked by UI framework choice)
- Integration tests (need test database setup)
- MFA implementation (marked as future enhancement)

**Testing Performed:**
- Manual API testing with curl commands
- Verified JWT signature validation
- Tested token expiration behavior

**Next Steps:**
User should test the login endpoint with Postman/curl. Once backend is verified, we can proceed with frontend integration.
```

**Why This Works:**
- **Transparency**: Shows every decision and why
- **Problem-solving**: Documents challenges and solutions
- **Context**: Explains file-level rationale
- **Honesty**: Admits what's incomplete
- **Actionable**: Tells user what to do next
- **Verification**: Shows testing performed

---

#### 4. **rewrite** Feedback

**Before:**
```
Description updated.
```

**After (Required):**
```
I've rewritten the task description for maximum clarity. Here's what changed:

**Original Issues:**
- Vague goal: "Add authentication"
- No technical approach specified
- Missing acceptance criteria
- Assumed knowledge (what type of auth?)

**Transformation Applied:**
1. **Goal Section** - Clarified WHY we need auth (secure user data, track sessions)
2. **Approach Section** - Specified JWT-based auth with bcrypt password hashing
3. **Acceptance Criteria** - Added 7 testable criteria (login success, token expiration, etc.)
4. **Notes Section** - Documented security constraints (OWASP, GDPR compliance)

**Assumptions Made:**
- Web application (not mobile) → affects token storage strategy
- Single-tenant system → no multi-org complexity
- GDPR compliance required → affects password reset flow

**Why This Matters:**
The original task was too vague to implement safely. Security features like auth require explicit requirements - vague specs lead to vulnerabilities.

**Readiness Assessment:**
The task is now implementation-ready. Recommend adding "expand" tag for technical details, then "code" tag for implementation.
```

**Why This Works:**
- **Before/after contrast** shows transformation
- **Explicit assumptions** prevent miscommunication
- **Security awareness** demonstrates expertise
- **Clear next steps** guides workflow

---

### Feedback Quality Standards

Every feedback response must include:

#### ✅ DO Include:
1. **Summary**: What you accomplished (1-2 sentences)
2. **Reasoning**: Why you made specific choices
3. **Impact**: How this improves the task
4. **Context**: What was missing or unclear before
5. **Next Steps**: What should happen next
6. **Risks/Blockers**: What could go wrong or is incomplete

#### ❌ DON'T Include:
1. **Empty platitudes**: "Comment added successfully"
2. **Raw JSON**: Don't dump tool responses
3. **Vague language**: "Made some improvements"
4. **No reasoning**: Just stating actions without explaining why
5. **Missing next steps**: Leaving user unsure what to do

---

### Why This Matters: "Description is Logic"

The feedback directives embed **reasoning requirements** into the prompts themselves:

**Traditional Approach:**
```
// Prompt: "Save your analysis as a comment"
// Result: AI saves comment, returns "Done"
```

**Description is Logic Approach:**
```
// Prompt: "After saving the comment, provide thoughtful feedback explaining:
// - What questions you asked and why they matter
// - What gaps or ambiguities you identified
// - How this interrogation improves the task quality
// - Next recommended steps"

// Result: AI saves comment AND explains reasoning
```

**The Difference:**
- **Traditional**: Action without context
- **Description is Logic**: Action WITH reasoning embedded in prompt

This makes the AI's **thought process discoverable** and **transparent** - the user understands not just WHAT happened, but WHY and HOW it improves their task.

---

### Feedback as Quality Metric

We can now measure feedback quality:

```typescript
interface FeedbackQuality {
  has_summary: boolean;           // Did AI summarize what was done?
  has_reasoning: boolean;          // Did AI explain WHY?
  has_impact: boolean;             // Did AI assess IMPACT?
  has_next_steps: boolean;         // Did AI recommend next action?
  has_risks: boolean;              // Did AI identify blockers?

  quality_score: number;           // 0-1 scale
}
```

**Good Feedback Example:**
```
✅ Summary: "I've added 5 questions about auth method"
✅ Reasoning: "JWT vs OAuth changes architecture"
✅ Impact: "Prevents wrong implementation direction"
✅ Next Steps: "Add expand tag after answering"
✅ Risks: "No password requirements = OWASP violation"

Score: 5/5 = 1.0 (excellent)
```

**Bad Feedback Example:**
```
❌ Summary: "Comment added"
❌ Reasoning: (missing)
❌ Impact: (missing)
❌ Next Steps: (missing)
❌ Risks: (missing)

Score: 1/5 = 0.2 (poor)
```

We can use this scoring to:
1. **A/B test** feedback prompt variations
2. **Train better models** on high-quality feedback examples
3. **Alert users** when feedback quality drops
4. **Auto-improve** prompts based on feedback patterns

---

## Files Modified

1. ✅ `/packages/mcp/index.js` - All 8 prompts updated
2. ✅ `/README.md` - Features + Examples updated
3. ✅ `/MCP_CAPABILITIES.md` - Added Required Actions table
4. ✅ `/PROMPT_IMPROVEMENTS.md` - This document (new)

---

## Next Steps

1. **Deploy updated MCP server** to test changes
2. **Monitor telemetry** for tool usage patterns
3. **Add prompt compliance metrics**:
   - % of interrogate tags that result in comments
   - % of code tags that result in file changes
   - Average time between tag detection → action completion
4. **Consider adding validation**:
   - Pre-prompt check: "Has add_comment been used?"
   - Post-prompt verification: "Did comment appear in Notion?"
   - Retry logic if action not completed

---

## Philosophy Alignment

This update embodies **"Description is Logic"** by:

1. **Making prompts executable**: AI can follow instructions without guessing
2. **Embedding validation rules**: "MUST use X" is both instruction and rule
3. **Documenting anti-patterns**: Shows what NOT to do
4. **Providing tool mappings**: Tag → Tool → Action is explicit
5. **Self-documenting behavior**: Code describes what it does in descriptions
6. **Enabling discoverability**: AI can query MCP to understand workflow
7. **Removing ambiguity**: Mandatory language eliminates interpretation
8. **Teaching by example**: Shows expected actions in documentation

**Result**: The MCP server's behavior is now EXECUTABLE by reading descriptions alone. An AI agent can understand "what to do", "how to do it", "why it matters", and "what tools to use" without reading implementation code.

---

**"If a human can understand it, an AI can execute it."** ✅
