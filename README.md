# taskflow-mcp

**AI-powered Notion task workflow automation for Claude Code**

taskflow-mcp is a Model Context Protocol (MCP) server that automates Notion task workflows with AI-powered tag processing. Simply add MCP tags to your Notion tasks, and Claude Code will intelligently interrogate, expand, critique, rewrite, and even implement them.

---

## 🎯 Features

### Full MCP Implementation
- **4 Tools** - Direct task processing, querying, and updates
- **3 Resources** - Quick access to Ready, In Progress, and all tagged tasks
- **6 Prompts** - AI-powered workflows (interrogate, expand, critique, user stories, rewrite, prepare for coding)
- **Sampling** - LLM-powered analysis integrated via prompts

### Intelligent Tag Processing
- **Priority-based** - Tags processed in optimal order automatically
- **Persona support** - "think like X" tags add expert context to all analysis
- **Automatic tag removal** - Tags cleared after successful processing
- **Dry-run mode** - Preview what would happen without making changes

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

---

## 🚀 Quick Start

### 1. Install

```bash
git clone https://github.com/themightyboosh/taskflow-mcp.git
cd taskflow-mcp
pnpm install
```

### 2. Configure

Create `.env` file in your project directory:

```env
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get your Notion token:** https://www.notion.so/my-integrations

### 3. Setup Claude Code

Add to your `.mcp.json` (or Claude Code config):

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

### 4. Add MCP Tags in Notion

Add a multi-select property called **"MCP"** to your Notion database, then tag tasks with:

- **think like [persona]** - e.g., "think like a security engineer"
- **interrogate** - Claude asks clarifying questions
- **expand** - Add technical detail
- **rewrite** - Rewrite for clarity
- **critique** - Get constructive feedback
- **user stories** - Generate user stories
- **to-do** - Add to todo list only
- **code** - Implement the task automatically

### 5. Use in Claude Code

**Via Resources:**
```
Show me notion://tasks/ready
```

**Via Tools:**
```
Process all my Notion tasks
```

**Via Prompts:**
```
Interrogate task [task-id]
```

---

## 📖 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup guide
- **[MCP_CAPABILITIES.md](./MCP_CAPABILITIES.md)** - Full MCP capability reference

---

## 🏗️ Architecture

```
taskflow-mcp/
├── packages/mcp/
│   ├── index.js              # Main MCP server
│   ├── notion-client.js      # Notion API wrapper
│   ├── utils/
│   │   ├── config-loader.js  # Per-project .env loading
│   │   ├── tag-manager.js    # Tag priority & processing
│   │   └── image-downloader.js  # Image download for vision
├── .env.example
├── .mcp.json.example
└── README.md
```

---

## 🎨 Tag Processing Order

Tags are processed in this priority order:

1. **think like [X]** - Sets persona context for all subsequent processing
2. **interrogate** - Asks clarifying questions
3. **rewrite** - Rewrites description for clarity
4. **estimate** - Estimates level of effort and refactoring needs
5. **expand** - Adds technical detail
6. **critique** - Provides feedback (with persona if set)
7. **user stories** - Generates user stories (appended to task description)
8. **to-do** - Adds to todo list (no implementation)
9. **code** - Triggers implementation (ONLY tag that writes code)
10. **confirm** - Verifies implementation is complete

Each tag is removed after successful processing.

---

## 💡 Usage Examples

### Example 1: Requirements Gathering

**Notion Task:** "Add user authentication"
**MCP Tags:** `interrogate`, `expand`, `user stories`

**What happens:**
1. **interrogate** → Claude asks questions about auth method, session management → **Saves as comment**
2. **expand** → Adds technical detail (JWT vs session, password requirements) → **Saves as comment**
3. **user stories** → Generates user stories for different auth scenarios → **Appends to task description**
4. All three tags removed after processing
5. All actions performed automatically - no manual intervention needed

### Example 2: Expert Review

**Notion Task:** "Implement payment processing"
**MCP Tags:** `think like a security engineer`, `critique`, `expand`

**What happens:**
1. **think like** → Sets persona: "security engineer"
2. **critique** → Critiques from security perspective (PCI compliance, data protection) → **Saves as comment**
3. **expand** → Expands with security-focused technical details → **Saves as comment**
4. All tags removed
5. All comments automatically added to Notion task

### Example 3: Full Implementation

**Notion Task:** "Add dark mode toggle"
**MCP Tags:** `interrogate`, `expand`, `code`

**What happens:**
1. **interrogate** → Claude asks about implementation approach, storage → **Saves as comment**
2. **expand** → Adds technical detail (CSS variables, localStorage, toggle component) → **Saves as comment**
3. **code** → Reviews requirements → **WRITES THE ACTUAL CODE** (creates files, edits components, etc.)
4. All tags removed after processing
5. Feature is fully implemented - not just analyzed

---

## 🔧 MCP Capabilities

### Tools (4)

| Tool | Description |
|------|-------------|
| `process_tasks` | Process all tasks with MCP tags |
| `query_tasks` | Query tasks by status or MCP tags |
| `add_comment` | Add comment to Notion task |
| `update_task` | Update task properties |

### Resources (3)

| Resource | Description |
|----------|-------------|
| `notion://tasks/ready` | Ready tasks with MCP tags |
| `notion://tasks/in-progress` | In Progress tasks with MCP tags |
| `notion://tasks/with-mcp-tags` | All tasks with MCP tags |

### Prompts (6)

| Prompt | Description |
|--------|-------------|
| `interrogate_task` | Ask clarifying questions |
| `expand_task` | Add technical detail |
| `critique_task` | Provide constructive feedback |
| `generate_user_stories` | Generate user stories |
| `rewrite_task` | Rewrite for clarity |
| `prepare_for_coding` | Analyze and implement |

See [MCP_CAPABILITIES.md](./MCP_CAPABILITIES.md) for full details.

---

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start MCP server (for testing)
pnpm start

# Development mode (auto-reload)
pnpm dev
```

---

## 🐛 Troubleshooting

### "No .env file found"
- taskflow-mcp requires per-project `.env` file
- Run from directory containing `.env` with `NOTION_TOKEN` and `NOTION_DATABASE_ID`

### "Property MCP does not exist"
- Add a multi-select property called "MCP" to your Notion database
- Configure your Notion integration to have access to the database

### MCP server not connecting
- Verify absolute path in `.mcp.json` is correct
- Ensure Node.js 20+ is installed
- Check Notion token is valid
- Restart Claude Code after config changes

---

## 📝 Requirements

- **Node.js** 20+
- **pnpm** 10+ (or npm)
- **Notion integration** with database access
- **Claude Code** with MCP support

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

### Development Setup

1. Fork and clone
2. `pnpm install`
3. Create a branch: `git checkout -b feat/my-feature`
4. Make changes and test
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feat/my-feature`
7. Open a PR

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/themightyboosh/taskflow-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/themightyboosh/taskflow-mcp/discussions)

---

## 📜 License

MIT © Monumental

---

## 🎯 Roadmap

- [ ] Multiple database support
- [ ] Custom tag definitions via config
- [ ] Background polling mode (watch for new tags)
- [ ] Webhook support for real-time processing
- [ ] Analytics dashboard
- [ ] Slack/Discord notifications
- [ ] Task templates
- [ ] Batch operations

---

**Made with ❤️ by Monumental**
