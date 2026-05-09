/**
 * PDF → Word (DOCX) Service
 *
 * Strategy: LibreOffice headless — the only open-source tool that produces
 * genuinely usable DOCX from PDF (preserving layout, paragraphs, fonts).
 *
 * System requirement: LibreOffice must be installed.
 *   Windows:       https://www.libreoffice.org/download/  (installer .msi)
 *   Ubuntu/Debian: sudo apt-get install -y libreoffice
 *   macOS:         brew install --cask libreoffice
 *
 * On Windows the executable is soffice.exe under Program Files\LibreOffice\program\
 * This service auto-detects it — no PATH setup required.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
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

/**
 * Find LibreOffice executable.
 * Checks PATH first, then probes Windows Program Files directories.
 * Returns the command string (may be quoted path on Windows).
 */
async function checkLibreOffice() {
  const isWindows = process.platform === 'win32';

  // Try PATH candidates first (works on Linux/macOS out of the box,
  // and on Windows if LO was added to PATH during install)
  const pathCandidates = isWindows
    ? ['soffice.exe', 'soffice']
    : ['libreoffice', 'libreoffice7.6', 'libreoffice7.5', 'soffice'];

  for (const cmd of pathCandidates) {
    try {
      await execAsync(`"${cmd}" --version`);
      return cmd;
    } catch { /* keep trying */ }
  }

  // Windows only: probe known install directories
  if (isWindows) {
    const programDirs = [
      process.env['ProgramFiles'],
      process.env['ProgramFiles(x86)'],
      'C:\\Program Files',
      'C:\\Program Files (x86)',
    ].filter(Boolean);

    for (const base of programDirs) {
      try {
        const entries = fs.readdirSync(base).filter((d) =>
          d.toLowerCase().startsWith('libreoffice')
        );
        for (const dir of entries) {
          const candidate = path.join(base, dir, 'program', 'soffice.exe');
          if (fs.existsSync(candidate)) {
            // Verify it actually runs
            try {
              await execAsync(`"${candidate}" --version`);
              logger.info(`Found LibreOffice at: ${candidate}`);
              return `"${candidate}"`;
            } catch { /* not executable */ }
          }
        }
      } catch { /* dir unreadable */ }
    }
  }

  return null;
}

/**
 * Convert a PDF file to DOCX using LibreOffice headless.
 *
 * @param {string} inputPath    - Absolute path to uploaded PDF
 * @param {string} originalName - Original filename (used for output naming)
 * @returns {Promise<{ filename, url, sizeBytes, sizeFormatted, processingTimeMs }>}
 */
async function pdfToWord(inputPath, originalName) {
  const loCommand = await checkLibreOffice();

  if (!loCommand) {
    throw Object.assign(
      new Error(
        'LibreOffice is not installed. ' +
        'Download it from https://www.libreoffice.org/download/ ' +
        'and restart the server.'
      ),
      { statusCode: 422 }
    );
  }

  // Generate output filename (.pdf → .docx)
  const baseName = path.basename(originalName, path.extname(originalName));
  const outputFilename = generateUniqueFilename(`${baseName}.docx`, '');

  logger.info(`Starting PDF→Word conversion: ${path.basename(inputPath)}`);
  const startTime = Date.now();

  /**
   * LibreOffice command.
   * All paths are quoted to handle spaces (critical on Windows).
   * loCommand may already be quoted (e.g. "C:\Program Files\LibreOffice\...").
   */
  const command = [
    loCommand,
    '--headless',
    '--nofirststartwizard',
    '--norestore',
    '--convert-to', 'docx:"MS Word 2007 XML"',
    '--outdir', `"${OUTPUT_DIR}"`,
    `"${inputPath}"`,
  ].join(' ');

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120_000,          // 2 min — large PDFs can be slow
      maxBuffer: 10 * 1024 * 1024,
      // On Windows, exec needs cmd shell to interpret quoted paths correctly
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });

    if (stderr && stderr.toLowerCase().includes('error')) {
      logger.warn(`LibreOffice stderr: ${stderr}`);
    }

    // LibreOffice auto-names output based on the input file's basename
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const autoOutputPath = path.join(OUTPUT_DIR, `${inputBasename}.docx`);

    if (!fs.existsSync(autoOutputPath)) {
      throw new Error(`LibreOffice did not produce output file. stdout: ${stdout}`);
    }

    // Rename to unique filename to prevent collisions
    const finalOutputPath = path.join(OUTPUT_DIR, outputFilename);
    await fs.promises.rename(autoOutputPath, finalOutputPath);

    const elapsed = Date.now() - startTime;
    const sizeBytes = await getFileSize(finalOutputPath);

    logger.info(`PDF→Word done in ${elapsed}ms: ${outputFilename} (${formatBytes(sizeBytes)})`);

    return {
      filename: outputFilename,
      url: getOutputUrl(outputFilename),
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      processingTimeMs: elapsed,
    };
  } catch (err) {
    logger.error(`PDF→Word failed: ${err.message}`);
    throw Object.assign(
      new Error(`PDF to Word conversion failed: ${err.message}`),
      { statusCode: 422 }
    );
  }
}

module.exports = { pdfToWord };
