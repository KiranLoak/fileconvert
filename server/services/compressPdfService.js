/**
 * PDF Compression Service
 *
 * Two-tier strategy:
 *  1. Ghostscript — best compression (handles embedded images well)
 *  2. pdf-lib re-save — pure Node.js fallback (~10-30% smaller)
 *
 * Windows Ghostscript install: https://www.ghostscript.com/releases/gsdnld.html
 *   Default path: C:\Program Files\gs\gs<version>\bin\gswin64c.exe
 *
 * This service auto-detects Ghostscript on Windows without PATH setup.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const logger = require('../utils/logger');
const {
  OUTPUT_DIR,
  generateUniqueFilename,
  getOutputUrl,
  getFileSize,
  formatBytes,
} = require('../utils/fileUtils');

const GS_PRESETS = {
  low:    'screen',   // heaviest compression — email/web sharing
  medium: 'ebook',    // balanced (default)
  high:   'printer',  // light compression — near-original quality
};

/**
 * Find Ghostscript executable.
 * Checks PATH, then probes Windows Program Files gs directory.
 */
async function checkGhostscript() {
  const isWindows = process.platform === 'win32';

  // PATH candidates
  const pathCandidates = isWindows
    ? ['gswin64c.exe', 'gswin32c.exe', 'gs']
    : ['gs'];

  for (const cmd of pathCandidates) {
    try {
      await execAsync(`"${cmd}" --version`);
      return cmd;
    } catch { /* keep trying */ }
  }

  // Windows only: probe C:\Program Files\gs\gs*\bin\
  if (isWindows) {
    const gsDirs = [
      'C:\\Program Files\\gs',
      'C:\\Program Files (x86)\\gs',
    ];

    for (const base of gsDirs) {
      try {
        const versions = fs.readdirSync(base);  // e.g. ["gs10.03.1"]
        for (const ver of versions.reverse()) {   // newest first
          for (const exe of ['gswin64c.exe', 'gswin32c.exe']) {
            const candidate = path.join(base, ver, 'bin', exe);
            if (fs.existsSync(candidate)) {
              try {
                await execAsync(`"${candidate}" --version`);
                logger.info(`Found Ghostscript at: ${candidate}`);
                return `"${candidate}"`;
              } catch { /* not executable */ }
            }
          }
        }
      } catch { /* dir may not exist */ }
    }
  }

  return null;
}

/** Compress via Ghostscript (preferred) */
async function compressWithGhostscript(inputPath, outputPath, preset) {
  const gsCmd = await checkGhostscript();
  if (!gsCmd) return false;

  const command = [
    gsCmd,
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=/${preset}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    `-sOutputFile="${outputPath}"`,
    `"${inputPath}"`,
  ].join(' ');

  try {
    await execAsync(command, {
      timeout: 120_000,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
    return fs.existsSync(outputPath);
  } catch (err) {
    logger.warn(`Ghostscript compression failed: ${err.message}`);
    return false;
  }
}

/** Fallback: pdf-lib re-save with object streams */
async function compressWithPdfLib(inputPath, outputPath) {
  try {
    const buffer = await fs.promises.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const compressed = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
    await fs.promises.writeFile(outputPath, compressed);
    return true;
  } catch (err) {
    logger.warn(`pdf-lib compression failed: ${err.message}`);
    return false;
  }
}

/**
 * Compress a PDF file.
 *
 * @param {string} inputPath
 * @param {string} originalName
 * @param {{ level?: 'low'|'medium'|'high' }} options
 */
async function compressPdf(inputPath, originalName, options = {}) {
  const { level = 'medium' } = options;
  const preset = GS_PRESETS[level] || GS_PRESETS.medium;

  const startTime = Date.now();
  const originalSize = await getFileSize(inputPath);

  logger.info(
    `Starting PDF compression: ${path.basename(inputPath)} ` +
    `(${formatBytes(originalSize)}, level: ${level})`
  );

  const baseName = path.basename(originalName, path.extname(originalName));
  const outputFilename = generateUniqueFilename(`${baseName}_compressed.pdf`, '');
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  // Try Ghostscript first, fall back to pdf-lib
  let method = 'ghostscript';
  let success = await compressWithGhostscript(inputPath, outputPath, preset);

  if (!success) {
    logger.info('Ghostscript unavailable — falling back to pdf-lib compression');
    method = 'pdf-lib';
    success = await compressWithPdfLib(inputPath, outputPath);
  }

  if (!success || !fs.existsSync(outputPath)) {
    throw Object.assign(
      new Error(
        'PDF compression failed. The file may be corrupted or encrypted.\n' +
        'For best results, install Ghostscript: https://www.ghostscript.com/releases/gsdnld.html'
      ),
      { statusCode: 422 }
    );
  }

  const compressedSize = await getFileSize(outputPath);

  // If compressed is larger (already optimised PDF), just copy original
  if (compressedSize >= originalSize) {
    logger.info('Compressed file is not smaller — returning original');
    await fs.promises.copyFile(inputPath, outputPath);
  }

  const finalSize = await getFileSize(outputPath);
  const savings = Math.max(0, originalSize - finalSize);
  const savingsPercent = originalSize > 0
    ? parseFloat(((savings / originalSize) * 100).toFixed(1))
    : 0;
  const elapsed = Date.now() - startTime;

  logger.info(
    `PDF compression done (${method}): ` +
    `${formatBytes(originalSize)} → ${formatBytes(finalSize)} (-${savingsPercent}%) in ${elapsed}ms`
  );

  return {
    filename: outputFilename,
    url: getOutputUrl(outputFilename),
    originalSize:    { bytes: originalSize, formatted: formatBytes(originalSize) },
    compressedSize:  { bytes: finalSize,    formatted: formatBytes(finalSize) },
    savings:         { bytes: savings,      formatted: formatBytes(savings) },
    savingsPercent,
    compressionMethod: method,
    processingTimeMs: elapsed,
  };
}

module.exports = { compressPdf };
