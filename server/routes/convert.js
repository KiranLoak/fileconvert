/**
 * Conversion Routes
 * Maps HTTP endpoints to controller handlers with appropriate upload middleware.
 *
 * POST /api/convert/pdf-to-word    → PDF → DOCX
 * POST /api/convert/pdf-to-jpg     → PDF → JPEG(s) / ZIP
 * POST /api/convert/jpg-to-pdf     → Images → PDF
 * POST /api/convert/merge-pdf      → Multiple PDFs → single PDF
 * POST /api/convert/compress-pdf   → PDF → compressed PDF
 */

const express = require('express');
const router = express.Router();

const {
  handlePdfToWord,
  handlePdfToJpg,
  handleJpgToPdf,
  handleMergePdf,
  handleCompressPdf,
} = require('../controllers/convertController');

const {
  uploadPDF,
  uploadMultiplePDFs,
  uploadImages,
} = require('../middleware/upload');

// ─── Middleware: wrap multer so errors flow to global error handler ───────────
function handleMulterErrors(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  };
}

// PDF → Word: single PDF upload
router.post(
  '/pdf-to-word',
  handleMulterErrors(uploadPDF.single('file')),
  handlePdfToWord
);

// PDF → JPG: single PDF upload, optional body params (quality, density)
router.post(
  '/pdf-to-jpg',
  handleMulterErrors(uploadPDF.single('file')),
  handlePdfToJpg
);

// JPG → PDF: multiple image uploads, field name 'files'
router.post(
  '/jpg-to-pdf',
  handleMulterErrors(uploadImages.array('files', 20)),
  handleJpgToPdf
);

// Merge PDFs: multiple PDF uploads, field name 'files'
router.post(
  '/merge-pdf',
  handleMulterErrors(uploadMultiplePDFs.array('files', 20)),
  handleMergePdf
);

// Compress PDF: single PDF upload, optional body param 'level'
router.post(
  '/compress-pdf',
  handleMulterErrors(uploadPDF.single('file')),
  handleCompressPdf
);

module.exports = router;
