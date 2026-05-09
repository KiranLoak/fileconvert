/**
 * File Utilities
 * Abstraction layer for file operations — designed to swap local → S3 easily.
 * All storage calls go through here, never directly in services.
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
const OUTPUT_DIR = path.join(__dirname, '..', process.env.OUTPUT_DIR || 'outputs');

/**
 * Sanitize a filename — strip path traversal, control chars, reserved names.
 * Returns a safe, clean filename.
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'file';

  // Remove path components
  let safe = path.basename(filename);

  // Remove null bytes and control characters
  safe = safe.replace(/[\x00-\x1f\x80-\x9f]/g, '');

  // Replace dangerous characters (keep alphanumerics, dots, dashes, underscores)
  safe = safe.replace(/[^a-zA-Z0-9._\-]/g, '_');

  // Prevent leading dots (hidden files)
  safe = safe.replace(/^\.+/, '');

  // Collapse multiple dots (prevent extension spoofing like file.pdf.exe)
  safe = safe.replace(/\.{2,}/g, '.');

  // Truncate to 100 chars (keep extension)
  if (safe.length > 100) {
    const ext = path.extname(safe);
    const base = path.basename(safe, ext).substring(0, 100 - ext.length);
    safe = base + ext;
  }

  return safe || 'file';
}

/**
 * Generate a unique filename while preserving the original extension.
 */
function generateUniqueFilename(originalName, suffix = '') {
  const ext = path.extname(originalName).toLowerCase();
  const id = uuidv4().replace(/-/g, '').substring(0, 12);
  const timestamp = Date.now();
  return `${timestamp}_${id}${suffix}${ext}`;
}

/**
 * Get the absolute path for an uploaded file.
 */
function getUploadPath(filename) {
  return path.join(UPLOAD_DIR, filename);
}

/**
 * Get the absolute path for an output file.
 */
function getOutputPath(filename) {
  return path.join(OUTPUT_DIR, filename);
}

/**
 * Get the public URL for a generated output file.
 *
 * Returns a root-relative path (/outputs/filename) so it works on any domain
 * without needing BASE_URL configured.
 *
 * If BASE_URL is explicitly set (e.g. for external S3 URLs), use that instead.
 * Future: replace with S3 presigned URL generation.
 */
function getOutputUrl(filename) {
  if (process.env.BASE_URL) {
    return `${process.env.BASE_URL}/outputs/${filename}`;
  }
  // Root-relative — works on any deployment without extra config
  return `/outputs/${filename}`;
}

/**
 * Delete a file safely (no-throw — logs warning if missing).
 */
async function deleteFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
    logger.info(`Deleted file: ${filePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`Could not delete file ${filePath}: ${err.message}`);
    }
  }
}

/**
 * Delete multiple files in parallel.
 */
async function deleteFiles(filePaths) {
  await Promise.all(filePaths.map((p) => deleteFile(p)));
}

/**
 * Get file size in bytes. Returns 0 if file doesn't exist.
 */
async function getFileSize(filePath) {
  try {
    const stat = await fs.promises.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

/**
 * Format bytes to human-readable string.
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Check if a file exists.
 */
async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file as Buffer.
 */
async function readFileBuffer(filePath) {
  return fs.promises.readFile(filePath);
}

/**
 * Write a buffer to the output directory.
 * Returns the filename saved.
 */
async function writeOutputFile(buffer, filename) {
  const outputPath = getOutputPath(filename);
  await fs.promises.writeFile(outputPath, buffer);
  return filename;
}

module.exports = {
  UPLOAD_DIR,
  OUTPUT_DIR,
  sanitizeFilename,
  generateUniqueFilename,
  getUploadPath,
  getOutputPath,
  getOutputUrl,
  deleteFile,
  deleteFiles,
  getFileSize,
  formatBytes,
  fileExists,
  readFileBuffer,
  writeOutputFile,
};
