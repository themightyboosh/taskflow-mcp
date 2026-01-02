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
 * Load configuration from .env file in current working directory
 * @returns {{token: string, databaseId: string}} Configuration object
 * @throws {Error} If .env file not found or required variables missing
 */
export function loadConfig() {
  const cwdEnvPath = resolve(process.cwd(), '.env');

  if (!existsSync(cwdEnvPath)) {
    throw new Error(
      `❌ No .env file found in current directory: ${process.cwd()}\n\n` +
      'taskflow-mcp requires per-project configuration.\n\n' +
      'Create a .env file with:\n' +
      '  NOTION_TOKEN=ntn_xxx\n' +
      '  NOTION_DATABASE_ID=xxx\n\n' +
      'Get your Notion integration token from: https://www.notion.so/my-integrations'
    );
  }

  // Load environment variables
  dotenv.config({ path: cwdEnvPath, override: true });

  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    const missing = [];
    if (!token) missing.push('NOTION_TOKEN');
    if (!databaseId) missing.push('NOTION_DATABASE_ID');

    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n\n` +
      'Your .env file must contain:\n' +
      '  NOTION_TOKEN=ntn_xxx\n' +
      '  NOTION_DATABASE_ID=xxx'
    );
  }

  return { token, databaseId };
}
