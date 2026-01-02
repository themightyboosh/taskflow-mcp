# Installing taskflow-mcp for Claude Code

## How MCP Servers Work

MCP servers are **stdio-based** (not HTTP servers). This means:
- ✅ They don't run continuously in the background
- ✅ Claude Code launches them automatically when needed
- ✅ They communicate via stdin/stdout
- ✅ Claude Code manages their lifecycle (start/stop)

**You don't need to "start" the server manually** - Claude Code handles this automatically!

---

## Step 1: Add Your Notion Credentials

Edit `.env` in the taskflow-mcp directory:

```bash
cd /Users/danielcrowder/Desktop/Projects/taskflow-mcp
nano .env
```

Add your real credentials:

```env
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
- Token: https://www.notion.so/my-integrations
- Database ID: From your Notion database URL

---

## Step 2: Configure Claude Code

### Option A: Global Configuration (Recommended)

Add to `~/.claude/.mcp.json`:

```bash
# Create/edit the file
nano ~/.claude/.mcp.json
```

Add this configuration:

```json
{
  "mcpServers": {
    "taskflow-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/danielcrowder/Desktop/Projects/taskflow-mcp/packages/mcp/index.js"],
      "env": {}
    }
  }
}
```

**Important:** If you already have other MCP servers configured, just add the `taskflow-mcp` entry inside the existing `mcpServers` object.

### Option B: Project-Specific Configuration

If you want taskflow-mcp only available in specific projects, add `.mcp.json` to each project directory with the same configuration above.

---

## Step 3: Restart Claude Code

After configuring, restart Claude Code completely:

```bash
# If using CLI
pkill -f "claude-code"

# Or restart your IDE/application
```

---

## Step 4: Test It Works

In Claude Code, try:

```
Show me notion://tasks/ready
```

Or:

```
Process my Notion tasks
```

You should see your Notion tasks!

---

## Verification Script

Run the test script to verify setup:

```bash
cd /Users/danielcrowder/Desktop/Projects/taskflow-mcp
./test-mcp.sh
```

This checks:
- ✓ Node.js version
- ✓ .env file exists
- ✓ Dependencies installed
- ✓ Server can start

---

## Troubleshooting

### "No .env file found"

**Solution:** Create `.env` file in taskflow-mcp directory with your Notion credentials.

```bash
cd /Users/danielcrowder/Desktop/Projects/taskflow-mcp
cp .env.example .env
nano .env  # Add your real credentials
```

### "MCP server not responding"

**Checks:**
1. Verify `.mcp.json` path is correct (absolute path)
2. Check Node.js is installed: `node --version` (need 20+)
3. Restart Claude Code completely
4. Check for typos in `.mcp.json`

**Test manually:**
```bash
cd /Users/danielcrowder/Desktop/Projects/taskflow-mcp
node packages/mcp/index.js
# Should show: "🚀 taskflow-mcp server starting..."
# Press Ctrl+C to stop
```

### "Property MCP does not exist"

**Solution:** Add multi-select property called "MCP" to your Notion database.

1. Open Notion database
2. Click "+" to add property
3. Name: `MCP`
4. Type: Multi-select
5. Add tag options: `interrogate`, `expand`, `code`, etc.

### MCP server not auto-starting

**This is normal!** MCP servers don't run continuously. Claude Code starts them when you:
- Use a resource (e.g., `notion://tasks/ready`)
- Call a tool (e.g., `process_tasks`)
- Invoke a prompt (e.g., `interrogate_task`)

If you see the server starting messages in Claude Code output, everything is working correctly.

---

## How to Update taskflow-mcp

```bash
cd /Users/danielcrowder/Desktop/Projects/taskflow-mcp
git pull origin main
pnpm install
# Restart Claude Code
```

---

## Startup Behavior

### What Happens Automatically

✅ **When Claude Code starts:** Nothing (MCP server doesn't start yet)
✅ **When you use a taskflow command:** Claude Code launches the MCP server
✅ **When you're done:** Claude Code stops the MCP server
✅ **Next time you use it:** Claude Code launches it again

This is **by design** - MCP servers are lightweight and start/stop on-demand.

### If You Want It Always Running (Not Recommended)

MCP servers are designed to be on-demand, but if you absolutely need it running continuously:

**Option: PM2 (Process Manager)**

```bash
# Install PM2 globally
npm install -g pm2

# Start taskflow-mcp
pm2 start packages/mcp/index.js --name taskflow-mcp --cwd /Users/danielcrowder/Desktop/Projects/taskflow-mcp

# Save configuration
pm2 save

# Setup startup on boot
pm2 startup
```

**Warning:** Running MCP servers as persistent processes is not the intended use case and may cause issues with Claude Code's lifecycle management.

---

## Current Configuration

**MCP Server Location:**
```
/Users/danielcrowder/Desktop/Projects/taskflow-mcp/packages/mcp/index.js
```

**Configuration File:**
```
~/.claude/.mcp.json
```

**Environment File:**
```
/Users/danielcrowder/Desktop/Projects/taskflow-mcp/.env
```

---

## Next Steps

1. ✅ Test with: `./test-mcp.sh`
2. ✅ Add real Notion credentials to `.env`
3. ✅ Configure `~/.claude/.mcp.json`
4. ✅ Restart Claude Code
5. ✅ Try: "Show me notion://tasks/ready"

---

**The MCP server will be automatically available whenever Claude Code needs it!** 🚀
