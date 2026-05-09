/**
 * Merge PDFs Service
 *
 * Merges 2–20 PDF files into a single PDF, preserving all pages in order.
 * Handles encrypted PDFs gracefully (skips with a warning rather than crashing).
 *
 * Uses: pdf-lib (pure Node.js — no system dependencies)
 */

const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const logger = require('../utils/logger');
const {
  OUTPUT_DIR,
  generateUniqueFilename,
  getOutputUrl,
  getFileSize,
  formatBytes,
} = require('../utils/fileUtils');

/**
 * Merge multiple PDF files into one.
 *
 * @param {string[]} inputPaths   - Ordered array of absolute paths to input PDFs
 * @param {string[]} originalNames
 * @returns {Promise<ConversionResult>}
 */
async function mergePdfs(inputPaths, originalNames) {
  const startTime = Date.now();
  logger.info(`Starting PDF merge: ${inputPaths.length} file(s)`);

  if (inputPaths.length < 2) {
    throw Object.assign(
      new Error('At least 2 PDF files are required to merge.'),
      { statusCode: 400 }
    );
  }

  const mergedDoc = await PDFDocument.create();
  let totalPagesCopied = 0;
  const skipped = [];

  for (let i = 0; i < inputPaths.length; i++) {
    const filePath = inputPaths[i];
    const fileName = originalNames[i] || path.basename(filePath);

    try {
      const buffer = await fs.promises.readFile(filePath);
      const srcDoc = await PDFDocument.load(buffer, {
        ignoreEncryption: true, // attempt to load encrypted PDFs
      });

      const pageCount = srcDoc.getPageCount();
      if (pageCount === 0) {
        logger.warn(`Skipping ${fileName}: 0 pages`);
        skipped.push(fileName);
        continue;
      }

      // Copy all page indices
      const pageIndices = Array.from({ length: pageCount }, (_, idx) => idx);
      const copiedPages = await mergedDoc.copyPagesFrom(srcDoc, pageIndices);

      copiedPages.forEach((page) => mergedDoc.addPage(page));
      totalPagesCopied += copiedPages.length;

      logger.info(`Merged ${fileName}: ${copiedPages.length} page(s)`);
    } catch (err) {
      logger.warn(`Could not merge ${fileName}: ${err.message}`);
      skipped.push(fileName);
    }
  }

  if (totalPagesCopied === 0) {
    throw Object.assign(
      new Error('No pages could be merged from the provided PDFs.'),
      { statusCode: 422 }
    );
  }

  // Set document metadata
  mergedDoc.setTitle('Merged Document');
  mergedDoc.setCreationDate(new Date());
  mergedDoc.setModificationDate(new Date());

  // Serialize
  const pdfBytes = await mergedDoc.save({ useObjectStreams: true });

  const outputFilename = generateUniqueFilename('merged.pdf', '');
  const outputPath = path.join(OUTPUT_DIR, outputFilename);
  await fs.promises.writeFile(outputPath, pdfBytes);

  const sizeBytes = await getFileSize(outputPath);
  const elapsed = Date.now() - startTime;

  logger.info(
    `PDF merge complete: ${totalPagesCopied} pages from ${inputPaths.length - skipped.length} file(s) in ${elapsed}ms`
  );

  return {
    filename: outputFilename,
    url: getOutputUrl(outputFilename),
    pageCount: totalPagesCopied,
    filesProcessed: inputPaths.length - skipped.length,
    filesSkipped: skipped,
    sizeBytes,
    sizeFormatted: formatBytes(sizeBytes),
    processingTimeMs: elapsed,
  };
}

module.exports = { mergePdfs };
