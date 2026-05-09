/**
 * JPG → PDF Service
 *
 * Combines one or more images (JPEG/PNG/WebP) into a single PDF.
 * Each image gets its own page, scaled to fit within standard A4 dimensions.
 *
 * Uses:
 *   - sharp: decode/normalize any image format → raw RGB bytes
 *   - pdf-lib: embed images and build PDF document
 *
 * No system dependencies required (pure Node.js).
 */

const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
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

// A4 dimensions in PDF points (72 points per inch)
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_PT = 36; // 0.5 inch margin

/**
 * Convert one or more image files to a single PDF.
 *
 * @param {string[]} inputPaths - Array of absolute paths to image files
 * @param {string[]} originalNames - Original filenames
 * @param {object} options
 * @param {boolean} options.fitToPage - Scale images to fit page (default: true)
 * @param {string} options.pageSize - 'a4' | 'letter' (default: 'a4')
 * @returns {Promise<ConversionResult>}
 */
async function jpgToPdf(inputPaths, originalNames, options = {}) {
  const { fitToPage = true } = options;

  const startTime = Date.now();
  logger.info(`Starting JPG→PDF: ${inputPaths.length} image(s)`);

  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < inputPaths.length; i++) {
    const imgPath = inputPaths[i];
    logger.info(`Processing image ${i + 1}/${inputPaths.length}: ${path.basename(imgPath)}`);

    try {
      // Use sharp to get metadata and convert to JPEG bytes (handles PNG, WebP, etc.)
      const { data: jpegBuffer, info } = await sharp(imgPath)
        .rotate() // auto-rotate based on EXIF
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      const { width: imgWidth, height: imgHeight } = info;

      // Determine page dimensions and image placement
      let pageWidth = A4_WIDTH_PT;
      let pageHeight = A4_HEIGHT_PT;

      // If image is landscape, rotate the page
      if (imgWidth > imgHeight) {
        [pageWidth, pageHeight] = [pageHeight, pageWidth];
      }

      const usableWidth = pageWidth - PAGE_MARGIN_PT * 2;
      const usableHeight = pageHeight - PAGE_MARGIN_PT * 2;

      // Scale image to fit within usable area
      const scale = fitToPage
        ? Math.min(usableWidth / imgWidth, usableHeight / imgHeight, 1)
        : 1;

      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      // Center image on page
      const x = PAGE_MARGIN_PT + (usableWidth - drawWidth) / 2;
      const y = PAGE_MARGIN_PT + (usableHeight - drawHeight) / 2;

      // Add page and embed image
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const embeddedImage = await pdfDoc.embedJpg(jpegBuffer);

      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    } catch (err) {
      logger.warn(`Skipping image ${i + 1} due to error: ${err.message}`);
      // Continue processing remaining images — don't fail the whole batch
    }
  }

  if (pdfDoc.getPageCount() === 0) {
    throw Object.assign(
      new Error('No images could be processed. Please check your files are valid images.'),
      { statusCode: 422 }
    );
  }

  // Generate output filename based on first uploaded file
  const baseName = path.basename(originalNames[0], path.extname(originalNames[0]));
  const outputFilename = generateUniqueFilename(
    `${baseName}_${inputPaths.length > 1 ? 'combined' : 'converted'}.pdf`,
    ''
  );
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  // Serialize and save PDF
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  await fs.promises.writeFile(outputPath, pdfBytes);

  const sizeBytes = await getFileSize(outputPath);
  const elapsed = Date.now() - startTime;

  logger.info(
    `JPG→PDF complete: ${pdfDoc.getPageCount()} page(s) in ${elapsed}ms (${formatBytes(sizeBytes)})`
  );

  return {
    filename: outputFilename,
    url: getOutputUrl(outputFilename),
    pageCount: pdfDoc.getPageCount(),
    sizeBytes,
    sizeFormatted: formatBytes(sizeBytes),
    processingTimeMs: elapsed,
  };
}

module.exports = { jpgToPdf };
