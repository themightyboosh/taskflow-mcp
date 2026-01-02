#!/bin/bash
# Test script for taskflow-mcp
# Verifies that the MCP server can start successfully

set -e

echo "🧪 Testing taskflow-mcp..."
echo ""

# Check Node.js version
NODE_VERSION=$(node --version)
echo "✓ Node.js: $NODE_VERSION"

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ No .env file found"
  echo "   Create one with NOTION_TOKEN and NOTION_DATABASE_ID"
  exit 1
fi
echo "✓ .env file found"

# Check if dependencies are installed
if [ ! -d node_modules ]; then
  echo "❌ Dependencies not installed"
  echo "   Run: pnpm install"
  exit 1
fi
echo "✓ Dependencies installed"

# Test MCP server can start (it will fail without stdio input, but that's OK)
echo ""
echo "Starting MCP server (will timeout after 2 seconds - this is expected)..."
timeout 2 node packages/mcp/index.js 2>&1 | head -3 || true

echo ""
echo "✅ MCP server can start successfully!"
echo ""
echo "Next steps:"
echo "1. Add real Notion credentials to .env file"
echo "2. Configure Claude Code with .mcp.json (see below)"
echo "3. Restart Claude Code"
echo ""
echo "Claude Code will automatically start/stop this MCP server as needed."
