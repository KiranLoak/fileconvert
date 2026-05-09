/**
 * Convert Controller
 * Handles all conversion endpoints. Thin orchestration layer:
 * validates → delegates to service → responds or forwards errors.
 */

const path = require('path');
const { pdfToWord } = require('../services/pdfToWordService');
const { pdfToJpg } = require('../services/pdfToJpgService');
const { jpgToPdf } = require('../services/jpgToPdfService');
const { mergePdfs } = require('../services/mergePdfService');
const { compressPdf } = require('../services/compressPdfService');
const { validateFiles, validateSingleFile } = require('../utils/validation');
const { deleteFiles } = require('../utils/fileUtils');
const logger = require('../utils/logger');

/**
 * Helper: clean up all uploaded files after processing.
 * Runs in background — does not delay response.
 */
function cleanupUploads(files) {
  if (!files || files.length === 0) return;
  const paths = files.map((f) => f.path);
  // Schedule for after response is sent
  setImmediate(() => {
    deleteFiles(paths).catch((e) =>
      logger.warn(`Cleanup upload failed: ${e.message}`)
    );
  });
}

// ─── PDF → Word ───────────────────────────────────────────────────────────────

async function handlePdfToWord(req, res, next) {
  const file = req.file;

  const { valid, error } = validateSingleFile(file, 'pdf-to-word');
  if (!valid) {
    cleanupUploads([file]);
    return next(Object.assign(new Error(error), { statusCode: 400 }));
  }

  try {
    const result = await pdfToWord(file.path, file.originalname);
    cleanupUploads([file]);

    return res.status(200).json({
      success: true,
      tool: 'pdf-to-word',
      data: result,
    });
  } catch (err) {
    cleanupUploads([file]);
    return next(err);
  }
}

// ─── PDF → JPG ────────────────────────────────────────────────────────────────

async function handlePdfToJpg(req, res, next) {
  const file = req.file;

  const { valid, error } = validateSingleFile(file, 'pdf-to-jpg');
  if (!valid) {
    cleanupUploads([file]);
    return next(Object.assign(new Error(error), { statusCode: 400 }));
  }

  const quality = parseInt(req.body?.quality || '85', 10);
  const density = parseInt(req.body?.density || '150', 10);

  try {
    const result = await pdfToJpg(file.path, file.originalname, {
      quality: Math.min(100, Math.max(10, quality)),
      density: Math.min(300, Math.max(72, density)),
    });
    cleanupUploads([file]);

    return res.status(200).json({
      success: true,
      tool: 'pdf-to-jpg',
      data: result,
    });
  } catch (err) {
    cleanupUploads([file]);
    return next(err);
  }
}

// ─── JPG → PDF ────────────────────────────────────────────────────────────────

async function handleJpgToPdf(req, res, next) {
  const files = req.files;

  const { valid, error } = validateFiles(files, 'jpg-to-pdf');
  if (!valid) {
    cleanupUploads(files);
    return next(Object.assign(new Error(error), { statusCode: 400 }));
  }

  try {
    const inputPaths = files.map((f) => f.path);
    const originalNames = files.map((f) => f.originalname);

    const result = await jpgToPdf(inputPaths, originalNames);
    cleanupUploads(files);

    return res.status(200).json({
      success: true,
      tool: 'jpg-to-pdf',
      data: result,
    });
  } catch (err) {
    cleanupUploads(files);
    return next(err);
  }
}

// ─── Merge PDFs ───────────────────────────────────────────────────────────────

async function handleMergePdf(req, res, next) {
  const files = req.files;

  const { valid, error } = validateFiles(files, 'merge-pdf');
  if (!valid) {
    cleanupUploads(files);
    return next(Object.assign(new Error(error), { statusCode: 400 }));
  }

  if (files.length < 2) {
    cleanupUploads(files);
    return next(
      Object.assign(new Error('Please upload at least 2 PDF files to merge.'), { statusCode: 400 })
    );
  }

  try {
    const inputPaths = files.map((f) => f.path);
    const originalNames = files.map((f) => f.originalname);

    const result = await mergePdfs(inputPaths, originalNames);
    cleanupUploads(files);

    return res.status(200).json({
      success: true,
      tool: 'merge-pdf',
      data: result,
    });
  } catch (err) {
    cleanupUploads(files);
    return next(err);
  }
}

// ─── Compress PDF ─────────────────────────────────────────────────────────────

async function handleCompressPdf(req, res, next) {
  const file = req.file;

  const { valid, error } = validateSingleFile(file, 'compress-pdf');
  if (!valid) {
    cleanupUploads([file]);
    return next(Object.assign(new Error(error), { statusCode: 400 }));
  }

  const level = ['low', 'medium', 'high'].includes(req.body?.level)
    ? req.body.level
    : 'medium';

  try {
    const result = await compressPdf(file.path, file.originalname, { level });
    cleanupUploads([file]);

    return res.status(200).json({
      success: true,
      tool: 'compress-pdf',
      data: result,
    });
  } catch (err) {
    cleanupUploads([file]);
    return next(err);
  }
}

module.exports = {
  handlePdfToWord,
  handlePdfToJpg,
  handleJpgToPdf,
  handleMergePdf,
  handleCompressPdf,
};
