/**
 * Image Downloader
 *
 * Downloads images from Notion pages to local cache for Claude Code vision capabilities.
 */

import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import https from 'https';
import http from 'http';

const CACHE_DIR = join(tmpdir(), 'taskflow-images');

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Download images from a Notion page
 * @param {object} notion - Notion client instance
 * @param {string} pageId - Notion page ID
 * @returns {Promise<string[]>} Array of local file paths
 */
export async function downloadTaskImages(notion, pageId) {
  ensureCacheDir();

  try {
    // Retrieve all blocks from the page
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    const imageBlocks = blocks.results.filter(b => b.type === 'image');

    if (imageBlocks.length === 0) {
      return [];
    }

    const downloadedPaths = [];

    for (let i = 0; i < imageBlocks.length; i++) {
      const block = imageBlocks[i];
      const imageUrl = block.image.file?.url || block.image.external?.url;

      if (!imageUrl) continue;

      const filename = `${pageId.replace(/-/g, '')}_${i}.png`;
      const filepath = join(CACHE_DIR, filename);

      // Check cache first
      if (existsSync(filepath)) {
        downloadedPaths.push(filepath);
        continue;
      }

      // Download image
      await downloadImage(imageUrl, filepath);
      downloadedPaths.push(filepath);
    }

    return downloadedPaths;
  } catch (error) {
    console.error(`Failed to download images for page ${pageId}:`, error.message);
    return [];
  }
}

/**
 * Download a single image from URL to filepath
 * @param {string} url - Image URL
 * @param {string} filepath - Destination file path
 * @returns {Promise<void>}
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(filepath);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

/**
 * Get the cache directory path
 * @returns {string} Cache directory path
 */
export function getCacheDir() {
  return CACHE_DIR;
}
