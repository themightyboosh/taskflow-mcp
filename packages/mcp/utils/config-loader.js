/**
 * Config Loader
 *
 * Loads NOTION_TOKEN and NOTION_DATABASE_ID from .env file in current working directory.
 * No global config - per-project only.
 */

import { resolve } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

/**
 * Load configuration from environment variables or .env file
 * Priority: 1) Environment variables (from MCP config), 2) .env file in cwd
 * @returns {{token: string, databaseId: string}} Configuration object
 * @throws {Error} If required variables missing
 */
export function loadConfig() {
  // First, check if environment variables are already set (e.g., from MCP server config)
  let token = process.env.NOTION_TOKEN;
  let databaseId = process.env.NOTION_DATABASE_ID;

  // If not set, try loading from .env file in current working directory
  if (!token || !databaseId) {
    const cwdEnvPath = resolve(process.cwd(), '.env');

    if (existsSync(cwdEnvPath)) {
      // Load environment variables from .env file (don't override existing ones)
      dotenv.config({ path: cwdEnvPath, override: false });

      token = process.env.NOTION_TOKEN;
      databaseId = process.env.NOTION_DATABASE_ID;
    }
  }

  // Validate that we have the required configuration
  if (!token || !databaseId) {
    const missing = [];
    if (!token) missing.push('NOTION_TOKEN');
    if (!databaseId) missing.push('NOTION_DATABASE_ID');

    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n\n` +
      'taskflow-mcp requires configuration via:\n' +
      '  1. Environment variables (set by MCP server config), OR\n' +
      '  2. .env file in current directory with:\n' +
      '     NOTION_TOKEN=ntn_xxx\n' +
      '     NOTION_DATABASE_ID=xxx\n\n' +
      'Get your Notion integration token from: https://www.notion.so/my-integrations'
    );
  }

  return { token, databaseId };
}
