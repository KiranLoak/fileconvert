/**
 * Multer Upload Middleware
 * Configures disk storage with sanitized filenames and size limits.
 * Separate instances per tool type for fine-grained control.
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sanitizeFilename, UPLOAD_DIR } = require('../utils/fileUtils');
const { MAX_FILE_SIZE_BYTES } = require('../utils/validation');

/**
 * Disk storage engine.
 * Filenames are: <timestamp>_<uuid8>_<sanitized_original>
 * This prevents any filename collision and strips dangerous characters.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    const id = uuidv4().replace(/-/g, '').substring(0, 8);
    const unique = `${Date.now()}_${id}_${sanitized}`;
    // Store original name on req for later reference
    file.storedName = unique;
    cb(null, unique);
  },
});

/**
 * MIME type filter — accepts only the given list.
 */
function createMimeFilter(allowedMimes) {
  return (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new multer.MulterError(
          'LIMIT_UNEXPECTED_FILE',
          `Unsupported file type: ${file.mimetype}`
        ),
        false
      );
    }
  };
}

// ─── Pre-configured Upload Instances ─────────────────────────────────────────

/** Single PDF upload */
const uploadPDF = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: createMimeFilter(['application/pdf']),
});

/** Multiple PDFs (merge, etc.) */
const uploadMultiplePDFs = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 20 },
  fileFilter: createMimeFilter(['application/pdf']),
});

/** Multiple images (jpg-to-pdf) */
const uploadImages = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 20 },
  fileFilter: createMimeFilter([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]),
});

/**
 * Wrap multer in a promise for cleaner async/await usage in controllers.
 * multer(req, res, callback) → returns a Promise.
 */
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = {
  uploadPDF,
  uploadMultiplePDFs,
  uploadImages,
  runMiddleware,
};
