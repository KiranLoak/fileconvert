const { exec }    = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const execAsync = promisify(exec);
const logger    = require('../utils/logger');
const {
  OUTPUT_DIR,
  generateUniqueFilename,
  getOutputUrl,
  getFileSize,
  formatBytes,
} = require('../utils/fileUtils');

async function checkLibreOffice() {
  const isWindows = process.platform === 'win32';
  const pathCandidates = isWindows ? ['soffice.exe', 'soffice'] : ['libreoffice', 'soffice'];

  for (const cmd of pathCandidates) {
    try {
      await execAsync(`"${cmd}" --version`, { timeout: 10_000 });
      return cmd;
    } catch { }
  }

  if (isWindows) {
    const bases = [process.env['ProgramFiles'], 'C:\\Program Files'].filter(Boolean);
    for (const base of bases) {
      try {
        const dirs = fs.readdirSync(base)
          .filter((d) => d.toLowerCase().startsWith('libreoffice'))
          .sort().reverse();
        for (const dir of dirs) {
          const exe = path.join(base, dir, 'program', 'soffice.exe');
          if (fs.existsSync(exe)) {
            try { await execAsync(`"${exe}" --version`, { timeout: 10_000 }); return `"${exe}"`; } catch { }
          }
        }
      } catch { }
    }
  }
  return null;
}

async function pdfToWord(inputPath, originalName) {
  const loCommand = await checkLibreOffice();
  if (!loCommand) {
    throw Object.assign(
      new Error('LibreOffice is not installed. Download from https://www.libreoffice.org/download/'),
      { statusCode: 422 }
    );
  }

  const baseName        = path.basename(originalName, path.extname(originalName));
  const outputFilename  = generateUniqueFilename(`${baseName}.docx`, '');
  const finalOutputPath = path.join(OUTPUT_DIR, outputFilename);
  const startTime       = Date.now();

  // Give each conversion its own isolated LO profile in /tmp.
  // This is the fix for Docker: without it LO silently fails because
  // it can't write its profile to the container user's home directory.
  const profileDir = path.join(os.tmpdir(), `lo-profile-${uuidv4()}`);
  await fs.promises.mkdir(profileDir, { recursive: true });
  const profileUri = `file:///${profileDir.replace(/\\/g, '/')}`;

  const command = [
    loCommand,
    '--headless',
    '--nofirststartwizard',
    '--norestore',
    `--env:UserInstallation=${profileUri}`,
    '--convert-to', 'docx:"MS Word 2007 XML"',
    '--outdir', `"${OUTPUT_DIR}"`,
    `"${inputPath}"`,
  ].join(' ');

  logger.info(`PDF→Word command: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });

    if (stdout) logger.info(`LO stdout: ${stdout.trim()}`);
    if (stderr) logger.warn(`LO stderr: ${stderr.trim()}`);

    const inputBasename  = path.basename(inputPath, path.extname(inputPath));
    const autoOutputPath = path.join(OUTPUT_DIR, `${inputBasename}.docx`);

    // Check multiple locations — LO sometimes writes to cwd instead of --outdir
    const candidates = [
      autoOutputPath,
      path.join(process.cwd(), `${inputBasename}.docx`),
      path.join(os.tmpdir(),   `${inputBasename}.docx`),
    ];

    let foundAt = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) { foundAt = c; break; }
    }

    if (!foundAt) {
      const listing = fs.readdirSync(OUTPUT_DIR).join(', ') || '(empty)';
      throw new Error(
        `LibreOffice ran but produced no .docx. ` +
        `OUTPUT_DIR contents: [${listing}]. LO output: "${stdout.trim()}"`
      );
    }

    if (foundAt !== finalOutputPath) {
      await fs.promises.rename(foundAt, finalOutputPath);
    }

    const elapsed   = Date.now() - startTime;
    const sizeBytes = await getFileSize(finalOutputPath);
    logger.info(`PDF→Word done in ${elapsed}ms → ${outputFilename} (${formatBytes(sizeBytes)})`);

    return { filename: outputFilename, url: getOutputUrl(outputFilename), sizeBytes, sizeFormatted: formatBytes(sizeBytes), processingTimeMs: elapsed };

  } finally {
    fs.promises.rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = { pdfToWord };
