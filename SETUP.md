# taskflow-mcp - Setup Guide

**Get up and running in 10 minutes.**

---

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 10+ (`npm install -g pnpm`)
- **Notion** account with integration access
- **Claude Code** (latest version)

---

## Step 1: Install taskflow-mcp

```bash
# Clone repository
git clone https://github.com/themightyboosh/taskflow-mcp.git
cd taskflow-mcp

# Install dependencies
pnpm install
```

---

## Step 2: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Name it (e.g., "taskflow-mcp")
4. Select workspace
5. Click **"Submit"**
6. Copy the **Internal Integration Token** (starts with `ntn_`)

---

## Step 3: Share Database with Integration

1. Open your Notion database (tasks, projects, etc.)
2. Click **"..."** menu in top right
3. Select **"Add connections"**
4. Find and select your integration
5. Click **"Confirm"**

---

## Step 4: Get Database ID

Your database ID is in the URL:

```
https://www.notion.so/[workspace]/[DATABASE_ID]?v=[view_id]
```

Copy the **DATABASE_ID** part (32 characters, no dashes).

---

## Step 5: Add MCP Property to Database

1. Open your Notion database
2. Click **"+"** to add a new property
3. Name it exactly: **"MCP"**
4. Select type: **Multi-select**
5. Add these options:
   - think like a security engineer
   - think like a UX lead
   - interrogate
   - expand
   - rewrite
   - critique
   - user stories
   - to-do
   - code

You can add more "think like" variations later!

---

## Step 6: Configure Environment

**Option A: Global .env (for single database)**

Create `.env` in `taskflow-mcp/`:

```env
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Option B: Per-project .env (for multiple databases)**

Create `.env` in each project directory:

```env
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=your_project_specific_database_id
```

taskflow-mcp will automatically use the `.env` file in your current working directory.

---

## Step 7: Configure Claude Code

Add to your `.mcp.json` (usually at `~/.claude/.mcp.json`):

```json
{
  "mcpServers": {
    "taskflow-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/taskflow-mcp/packages/mcp/index.js"]
    }
  }
}
```

**Important:** Replace `/absolute/path/to/` with your actual path!

**Find your path:**
```bash
cd /path/to/taskflow-mcp && pwd
# Copy the output
```

---

## Step 8: Test Connection

### Test MCP Server

```bash
cd /directory/with/.env
node /path/to/taskflow-mcp/packages/mcp/index.js
```

You should see:
```
🚀 taskflow-mcp server starting...
✅ taskflow-mcp server running
```

Press `Ctrl+C` to stop.

### Test in Claude Code

Restart Claude Code, then try:

```
Show me notion://tasks/ready
```

You should see your Notion tasks!

---

## Step 9: Add Tags and Test

1. Go to your Notion database
2. Select a task
3. Add MCP tag: **"interrogate"**
4. In Claude Code, say:

```
Process my Notion tasks
```

Claude will interrogate the task and add questions as a comment!

---

## Usage Patterns

### Pattern 1: Requirements Gathering

**Tags:** `interrogate` → `expand` → `user stories`

```
1. Claude asks clarifying questions
2. Adds technical detail
3. Generates user stories
4. Saves all as comments
```

### Pattern 2: Expert Review

**Tags:** `think like a security engineer` → `critique` → `expand`

```
1. Sets security engineer persona
2. Critiques from security perspective
3. Expands with security details
```

### Pattern 3: Full Implementation

**Tags:** `interrogate` → `expand` → `code`

```
1. Gathers requirements
2. Adds technical detail
3. Implements the task
```

### Pattern 4: Just Implement

**Tags:** `code`

```
1. Analyzes task
2. Starts implementing immediately
```

---

## Advanced Configuration

### Multiple Databases

Create different `.env` files in different project directories:

```
~/projects/client-a/.env     # Client A database
~/projects/client-b/.env     # Client B database
~/projects/personal/.env     # Personal database
```

taskflow-mcp uses the `.env` in your current directory.

### Custom "think like" Personas

Add any persona to your MCP property:

- think like a product manager
- think like a backend engineer
- think like a DevOps expert
- think like a data scientist

The text after "think like" becomes the persona context.

### Dry Run Mode

Preview what would happen without actually processing:

```
Process my tasks in dry-run mode
```

Or use the tool directly:
```javascript
{
  "tool": "process_tasks",
  "arguments": {
    "dryRun": true
  }
}
```

---

## Troubleshooting

### Error: "No .env file found"

**Cause:** No `.env` file in current directory

**Fix:**
```bash
# Check current directory
pwd

# Create .env file
cat > .env << EOF
NOTION_TOKEN=ntn_xxx
NOTION_DATABASE_ID=xxx
EOF
```

### Error: "Property MCP does not exist"

**Cause:** Notion database missing MCP property

**Fix:**
1. Open Notion database
2. Add multi-select property named "MCP"
3. Add tag options listed in Step 5

### Error: "Could not reach database"

**Cause:** Integration not connected to database

**Fix:**
1. Open database in Notion
2. Click "..." → "Add connections"
3. Select your integration
4. Click "Confirm"

### MCP Server Not Connecting in Claude Code

**Checks:**
1. Verify `.mcp.json` has absolute path
2. Restart Claude Code after config changes
3. Check Node.js version: `node --version` (should be 20+)
4. Test MCP server manually (see Step 8)

### Tags Not Being Removed

**Cause:** Dry-run mode enabled or errors during processing

**Fix:**
- Check Claude Code output for errors
- Verify task ID is correct
- Try manual tag removal:
  ```javascript
  {
    "tool": "update_task",
    "arguments": {
      "taskId": "your-task-id",
      "removeTags": ["interrogate"]
    }
  }
  ```

---

## Next Steps

- Read [MCP_CAPABILITIES.md](./MCP_CAPABILITIES.md) for full capability reference
- Explore different tag combinations
- Create custom "think like" personas
- Set up multiple databases for different projects

---

## Support

Having issues? Check:

1. [Troubleshooting](#troubleshooting) section above
2. [GitHub Issues](https://github.com/themightyboosh/taskflow-mcp/issues)
3. [GitHub Discussions](https://github.com/themightyboosh/taskflow-mcp/discussions)

---

**Ready to go! Start tagging tasks in Notion and let Claude Code automate your workflow.**
