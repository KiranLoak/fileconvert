/**
 * PDF → JPG Service
 *
 * Renders each page of a PDF as a JPEG image.
 *
 * Strategy:
 *   1. pdf2pic (wraps GraphicsMagick/ImageMagick) renders pages → raw images
 *   2. sharp optimises each image (quality, mozjpeg)
 *   3. Single page → return JPEG directly
 *      Multi-page → zip all JPEGs for download
 *
 * Windows setup (pick one):
 *   GraphicsMagick: https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/
 *                   Install the Windows .exe — it adds gm.exe to PATH automatically.
 *   ImageMagick:    https://imagemagick.org/script/download.php#windows
 *                   Install with "Add to PATH" checked.
 *
 * After installing, restart your terminal before running the server.
 */

const { fromPath } = require('pdf2pic');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const logger = require('../utils/logger');
const {
  OUTPUT_DIR,
  generateUniqueFilename,
  getOutputUrl,
  getFileSize,
  formatBytes,
} = require('../utils/fileUtils');

/** Get PDF page count using pdfinfo (poppler) or pdf-lib fallback */
async function getPdfPageCount(inputPath) {
  // Try pdfinfo (poppler-utils) — available on Linux/macOS, optional on Windows
  try {
    const cmd = process.platform === 'win32' ? 'pdfinfo.exe' : 'pdfinfo';
    const { stdout } = await execAsync(`"${cmd}" "${inputPath}"`);
    const match = stdout.match(/Pages:\s+(\d+)/);
    if (match) return parseInt(match[1], 10);
  } catch { /* not available — use pdf-lib */ }

  try {
    const { PDFDocument } = require('pdf-lib');
    const buffer = await fs.promises.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch {
    return 1;
  }
}

/**
 * Convert all pages of a PDF to JPEGs.
 *
 * @param {string}  inputPath    - Absolute path to PDF
 * @param {string}  originalName
 * @param {object}  options
 * @param {number}  options.quality  - JPEG quality 1–100 (default: 85)
 * @param {number}  options.density  - Render DPI (default: 150)
 */
async function pdfToJpg(inputPath, originalName, options = {}) {
  const { quality = 85, density = 150 } = options;
  const baseName = path.basename(originalName, path.extname(originalName));
  const startTime = Date.now();

  logger.info(`Starting PDF→JPG: ${path.basename(inputPath)} (${density}dpi, q${quality})`);

  const pageCount = await getPdfPageCount(inputPath);
  logger.info(`PDF page count: ${pageCount}`);

  // Temp sub-directory scoped to this conversion
  const tempDir = path.join(OUTPUT_DIR, `pdfimg_${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  try {
    // ── Render pages ──────────────────────────────────────────────
    const converter = fromPath(inputPath, {
      density,
      saveFilename: 'page',
      savePath: tempDir,
      format: 'jpg',
      width: 2480,
      height: 3508,
    });

    // -1 = render all pages
    const results = await converter.bulk(-1, { responseType: 'image' });

    if (!results || results.length === 0) {
      throw new Error('pdf2pic returned no results. Is GraphicsMagick or ImageMagick installed?');
    }

    logger.info(`Rendered ${results.length} page(s)`);

    // ── Optimize with sharp ───────────────────────────────────────
    const optimizedPaths = [];
    for (let i = 0; i < results.length; i++) {
      const rawPath = results[i].path;
      if (!rawPath || !fs.existsSync(rawPath)) continue;

      const outputFilename = `${Date.now()}_${baseName}_page${String(i + 1).padStart(3, '0')}.jpg`;
      const outputPath = path.join(OUTPUT_DIR, outputFilename);

      await sharp(rawPath)
        .jpeg({ quality, mozjpeg: true })
        .toFile(outputPath);

      optimizedPaths.push({ filename: outputFilename, path: outputPath });
      await fs.promises.unlink(rawPath).catch(() => {});
    }

    await fs.promises.rmdir(tempDir).catch(() => {});

    if (optimizedPaths.length === 0) {
      throw new Error('No images were produced after optimisation.');
    }

    // ── Single page: return JPEG directly ─────────────────────────
    if (optimizedPaths.length === 1) {
      const { filename, path: filePath } = optimizedPaths[0];
      const sizeBytes = await getFileSize(filePath);
      const elapsed = Date.now() - startTime;
      logger.info(`PDF→JPG complete (1 page) in ${elapsed}ms`);
      return {
        type: 'single',
        filename,
        url: getOutputUrl(filename),
        pageCount: 1,
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        processingTimeMs: elapsed,
      };
    }

    // ── Multiple pages: zip ───────────────────────────────────────
    const zipFilename = generateUniqueFilename(`${baseName}_pages.zip`, '');
    const zipPath = path.join(OUTPUT_DIR, zipFilename);
    await createZip(optimizedPaths.map((f) => f.path), zipPath, baseName);

    // Clean up individual images
    await Promise.all(optimizedPaths.map((f) => fs.promises.unlink(f.path).catch(() => {})));

    const sizeBytes = await getFileSize(zipPath);
    const elapsed = Date.now() - startTime;
    logger.info(`PDF→JPG complete (${optimizedPaths.length} pages, zipped) in ${elapsed}ms`);

    return {
      type: 'zip',
      filename: zipFilename,
      url: getOutputUrl(zipFilename),
      pageCount: optimizedPaths.length,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      processingTimeMs: elapsed,
    };
  } catch (err) {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    logger.error(`PDF→JPG failed: ${err.message}`);
    throw Object.assign(
      new Error(
        `PDF to JPG conversion failed: ${err.message}\n` +
        'Make sure GraphicsMagick or ImageMagick is installed.\n' +
        'Windows: https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/'
      ),
      { statusCode: 422 }
    );
  }
}

/** Zip an array of image file paths */
function createZip(filePaths, outputPath, baseName) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    filePaths.forEach((filePath, i) => {
      archive.file(filePath, { name: `${baseName}_page${String(i + 1).padStart(3, '0')}.jpg` });
    });
    archive.finalize();
  });
}

module.exports = { pdfToJpg };
