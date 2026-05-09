/**
 * File Cleanup Utility
 * Scans upload and output directories, removes files older than the expiry window.
 * Called on a cron schedule from server.js — no side effects on fresh files.
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const EXPIRY_MINUTES = parseInt(process.env.FILE_EXPIRY_MINUTES || '30', 10);
const EXPIRY_MS = EXPIRY_MINUTES * 60 * 1000;

/**
 * Delete files in a directory that were last modified more than EXPIRY_MS ago.
 * @param {string} dir - Absolute path to directory
 * @returns {number} Count of deleted files
 */
async function cleanupDirectory(dir) {
  let deletedCount = 0;

  try {
    const files = await fs.promises.readdir(dir);
    const now = Date.now();

    await Promise.all(
      files.map(async (filename) => {
        // Never delete .gitkeep or other marker files
        if (filename.startsWith('.')) return;

        const filePath = path.join(dir, filename);
        try {
          const stat = await fs.promises.stat(filePath);

          // Skip directories
          if (stat.isDirectory()) return;

          const age = now - stat.mtimeMs;
          if (age > EXPIRY_MS) {
            await fs.promises.unlink(filePath);
            deletedCount++;
            logger.info(`Cleanup: Deleted expired file ${filename} (age: ${Math.round(age / 60000)}min)`);
          }
        } catch (err) {
          logger.warn(`Cleanup: Could not process ${filePath}: ${err.message}`);
        }
      })
    );
  } catch (err) {
    logger.error(`Cleanup: Failed to read directory ${dir}: ${err.message}`);
  }

  return deletedCount;
}

/**
 * Clean both upload and output directories.
 * @param {string} uploadDir
 * @param {string} outputDir
 */
async function cleanupExpiredFiles(uploadDir, outputDir) {
  const [uploadDeleted, outputDeleted] = await Promise.all([
    cleanupDirectory(uploadDir),
    cleanupDirectory(outputDir),
  ]);

  const total = uploadDeleted + outputDeleted;
  if (total > 0) {
    logger.info(`Cleanup complete: ${total} file(s) removed (${uploadDeleted} uploads, ${outputDeleted} outputs)`);
  } else {
    logger.info('Cleanup complete: No expired files found.');
  }

  return { uploadDeleted, outputDeleted };
}

module.exports = { cleanupExpiredFiles, cleanupDirectory };
