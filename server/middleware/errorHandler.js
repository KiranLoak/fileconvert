/**
 * Error Handler Middleware
 * Centralized error formatting — always returns consistent JSON shape.
 */

const multer = require('multer');
const logger = require('../utils/logger');

/**
 * Formats an error response body.
 */
function formatError(message, code = 'CONVERSION_ERROR', details = null) {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return body;
}

/**
 * 404 handler — must be placed after all valid routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json(formatError(`Route ${req.method} ${req.path} not found.`, 'NOT_FOUND'));
}

/**
 * Global error handler — must be placed last, after all routes.
 * Express identifies it by the 4-parameter signature.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // ─── Multer Errors ──────────────────────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `File too large. Maximum size allowed is ${process.env.MAX_FILE_SIZE_MB || 50}MB.`,
      LIMIT_FILE_COUNT: 'Too many files uploaded at once.',
      LIMIT_UNEXPECTED_FILE: err.message || 'Unexpected file in upload.',
    };
    return res
      .status(400)
      .json(formatError(messages[err.code] || err.message, err.code));
  }

  // ─── CORS Errors ─────────────────────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json(formatError(err.message, 'CORS_ERROR'));
  }

  // ─── Validation Errors (thrown from controllers) ──────────────────────────
  if (err.statusCode === 400) {
    return res.status(400).json(formatError(err.message, 'VALIDATION_ERROR'));
  }

  // ─── Known Conversion Errors ──────────────────────────────────────────────
  if (err.statusCode === 422) {
    return res.status(422).json(formatError(err.message, 'CONVERSION_FAILED', err.details));
  }

  // ─── Unexpected Errors ────────────────────────────────────────────────────
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json(
    formatError(
      isDev ? err.message : 'An unexpected server error occurred.',
      'SERVER_ERROR',
      isDev ? err.stack : undefined
    )
  );
}

/**
 * Convenience: create a well-typed validation error.
 */
function createValidationError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

/**
 * Convenience: create a well-typed conversion error.
 */
function createConversionError(message, details) {
  const err = new Error(message);
  err.statusCode = 422;
  if (details) err.details = details;
  return err;
}

module.exports = {
  notFoundHandler,
  errorHandler,
  createValidationError,
  createConversionError,
};
