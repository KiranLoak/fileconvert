/**
 * File Validation
 * Per-tool type and size constraints. Centralized so rules are easy to update.
 */

const path = require('path');

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// MIME types accepted per conversion tool
const TOOL_CONFIG = {
  'pdf-to-word': {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxFiles: 1,
    label: 'PDF',
  },
  'pdf-to-jpg': {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxFiles: 1,
    label: 'PDF',
  },
  'jpg-to-pdf': {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFiles: 20,
    label: 'JPG/PNG image',
  },
  'merge-pdf': {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxFiles: 20,
    label: 'PDF',
  },
  'compress-pdf': {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxFiles: 1,
    label: 'PDF',
  },
};

/**
 * Validate an array of uploaded Multer file objects for a given tool.
 * Returns { valid: boolean, error: string | null }
 */
function validateFiles(files, toolName) {
  const config = TOOL_CONFIG[toolName];
  if (!config) {
    return { valid: false, error: `Unknown tool: ${toolName}` };
  }

  if (!files || files.length === 0) {
    return { valid: false, error: 'No files were uploaded.' };
  }

  if (files.length > config.maxFiles) {
    return {
      valid: false,
      error: `Too many files. Maximum allowed: ${config.maxFiles}.`,
    };
  }

  for (const file of files) {
    // Check MIME type (client-provided, but still validate)
    const isMimeValid = config.mimeTypes.includes(file.mimetype);

    // Also check extension (defense-in-depth)
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtValid = config.extensions.includes(ext);

    if (!isMimeValid && !isExtValid) {
      return {
        valid: false,
        error: `Invalid file type for "${file.originalname}". Expected: ${config.label}.`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File "${file.originalname}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
      };
    }

    // Reject zero-byte files
    if (file.size === 0) {
      return {
        valid: false,
        error: `File "${file.originalname}" is empty.`,
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validate a single file (convenience wrapper).
 */
function validateSingleFile(file, toolName) {
  return validateFiles([file], toolName);
}

module.exports = {
  TOOL_CONFIG,
  MAX_FILE_SIZE_BYTES,
  validateFiles,
  validateSingleFile,
};
