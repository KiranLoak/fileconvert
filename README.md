# FileConvert

A clean, production-ready full-stack file conversion platform. Convert PDFs to Word documents, render PDFs as images, combine images into PDFs, merge multiple PDFs, and compress PDFs — all with a premium dark/light mode UI.

---

## ✨ Features

| Tool | Input | Output | Engine |
|---|---|---|---|
| PDF → Word | `.pdf` | `.docx` | LibreOffice headless |
| PDF → JPG | `.pdf` | `.jpg` / `.zip` | pdf2pic + sharp |
| JPG → PDF | `.jpg`, `.png`, `.webp` | `.pdf` | pdf-lib + sharp |
| Merge PDF | `.pdf` (2–20 files) | `.pdf` | pdf-lib |
| Compress PDF | `.pdf` | `.pdf` | Ghostscript + pdf-lib |

---

## 🏗️ Project Structure

```
fileconvert/
├── package.json              ← Root workspace (run both apps together)
│
├── server/                   ← Node.js + Express backend
│   ├── server.js             ← Entry point, middleware, cron cleanup
│   ├── .env                  ← Environment variables
│   ├── routes/
│   │   └── convert.js        ← All /api/convert/* routes
│   ├── controllers/
│   │   └── convertController.js  ← Request handling, validation, cleanup
│   ├── services/
│   │   ├── pdfToWordService.js   ← LibreOffice conversion
│   │   ├── pdfToJpgService.js    ← pdf2pic + sharp rendering
│   │   ├── jpgToPdfService.js    ← pdf-lib image embedding
│   │   ├── mergePdfService.js    ← pdf-lib page merging
│   │   └── compressPdfService.js ← Ghostscript + pdf-lib compression
│   ├── middleware/
│   │   ├── upload.js         ← Multer configuration
│   │   └── errorHandler.js   ← Global error formatting
│   ├── utils/
│   │   ├── fileUtils.js      ← Storage abstraction layer
│   │   ├── validation.js     ← Per-tool file type/size rules
│   │   ├── cleanup.js        ← Scheduled file deletion
│   │   └── logger.js         ← Winston structured logging
│   ├── uploads/              ← Temporary uploaded files
│   └── outputs/              ← Generated output files (served statically)
│
└── client/                   ← React + Vite frontend
    ├── index.html
    ├── vite.config.js        ← Dev proxy to :5000
    ├── src/
    │   ├── App.jsx           ← Router + ThemeProvider
    │   ├── main.jsx
    │   ├── hooks/
    │   │   ├── useTheme.jsx  ← Dark/light theme context
    │   │   └── useConversion.js  ← Shared upload/convert state machine
    │   ├── services/
    │   │   └── api.js        ← Axios wrappers for all endpoints
    │   ├── components/
    │   │   ├── Header.jsx/css
    │   │   ├── Footer.jsx/css
    │   │   ├── ThemeToggle.jsx/css
    │   │   ├── DropZone.jsx/css    ← react-dropzone wrapper
    │   │   ├── FileCard.jsx/css    ← File preview with remove
    │   │   ├── ProgressBar.jsx/css ← Upload + processing progress
    │   │   ├── ResultPanel.jsx/css ← Download panel
    │   │   ├── ErrorAlert.jsx/css
    │   │   └── ToolPage.jsx/css    ← Shared tool page layout
    │   ├── pages/
    │   │   ├── Home.jsx/css        ← Landing + tool grid
    │   │   ├── PdfToWord.jsx
    │   │   ├── PdfToJpg.jsx
    │   │   ├── JpgToPdf.jsx
    │   │   ├── MergePdf.jsx
    │   │   └── CompressPdf.jsx
    │   └── styles/
    │       └── global.css    ← Design tokens, typography, animations
    └── public/
        └── favicon.svg
```

---

## 🚀 Quick Start

### Prerequisites

Install these system tools before running the app:

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y libreoffice ghostscript graphicsmagick poppler-utils

# macOS (Homebrew)
brew install --cask libreoffice
brew install ghostscript graphicsmagick poppler

# Windows
# LibreOffice:    https://www.libreoffice.org/download/
# Ghostscript:    https://www.ghostscript.com/releases/gsdnld.html
# GraphicsMagick: http://www.graphicsmagick.org/download.html
```

> **Note:** If system tools are missing, tools that require them will return a clear error message. `JPG → PDF` and `Merge PDF` work with zero system dependencies.

### 1. Clone & install

```bash
git clone <your-repo>
cd fileconvert

# Install all dependencies (server + client)
npm install               # installs concurrently at root
npm run install:all       # installs server/ and client/ deps
```

### 2. Configure environment

```bash
# Server env is already pre-configured for dev
cp server/.env.example server/.env   # if .env doesn't exist
```

### 3. Run in development

```bash
# Starts both server (:5000) and Vite dev server (:5173) with live reload
npm run dev
```

Open **http://localhost:5173**

The Vite dev server proxies `/api` and `/outputs` to Express on `:5000`, so no CORS issues in development.

### 4. Run separately (optional)

```bash
npm run dev:server   # Express only
npm run dev:client   # Vite only
```

---

## 📡 API Reference

All endpoints accept `multipart/form-data`.

### `POST /api/convert/pdf-to-word`
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PDF file (max 50MB) |

**Response:**
```json
{
  "success": true,
  "tool": "pdf-to-word",
  "data": {
    "filename": "1721234567_abc123_doc_converted.docx",
    "url": "http://localhost:5000/outputs/...",
    "sizeBytes": 245760,
    "sizeFormatted": "240 KB",
    "processingTimeMs": 3200
  }
}
```

### `POST /api/convert/pdf-to-jpg`
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PDF file (max 50MB) |
| `quality` | String | JPEG quality 10–100 (default: `85`) |
| `density` | String | DPI 72–300 (default: `150`) |

### `POST /api/convert/jpg-to-pdf`
| Field | Type | Description |
|-------|------|-------------|
| `files` | File[] | 1–20 images (JPG/PNG/WebP, max 50MB each) |

### `POST /api/convert/merge-pdf`
| Field | Type | Description |
|-------|------|-------------|
| `files` | File[] | 2–20 PDF files (max 50MB each) |

### `POST /api/convert/compress-pdf`
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PDF file (max 50MB) |
| `level` | String | `low` \| `medium` \| `high` (default: `medium`) |

### `GET /api/health`
Returns server status and version.

### Error response shape (all endpoints)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file type. Expected: PDF."
  }
}
```

---

## 🌍 Production Deployment

### Build frontend
```bash
npm run build
# Outputs to client/dist/
```

### Serve with Express (optional)
Add this to `server.js` to serve the built frontend:

```js
// After API routes, before error handlers:
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

### Environment variables for production
```env
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://yourdomain.com
BASE_URL=https://yourdomain.com
FILE_EXPIRY_MINUTES=30
MAX_FILE_SIZE_MB=50
```

### Deploy to Railway / Render / Fly.io
These platforms support Node.js + system package installation. Add a build command:
```bash
apt-get install -y libreoffice ghostscript graphicsmagick && npm run install:all
```

---

## 🔮 Extending the Project

### Swap local storage → AWS S3
All file I/O is routed through `server/utils/fileUtils.js`. Replace `getOutputUrl()`, `writeOutputFile()`, and `deleteFile()` with S3 SDK calls and the rest of the app updates automatically.

### Add async job queue (Bull/BullMQ)
Controllers are already thin wrappers — move the `service.convert()` call into a Bull job processor and return a `jobId` immediately. Poll `/api/jobs/:id` for status.

### Add more conversion tools
1. Create `server/services/yourToolService.js`
2. Add a handler in `server/controllers/convertController.js`
3. Register the route in `server/routes/convert.js`
4. Add a page in `client/src/pages/`
5. Update `TOOLS` array in `client/src/pages/Home.jsx`

---

## 🛡️ Security Features

- **Helmet** — sets secure HTTP headers
- **Rate limiting** — 100 requests/15min per IP
- **Filename sanitization** — strips path traversal and dangerous chars
- **MIME + extension validation** — checked independently per tool
- **File size limits** — enforced at Multer and validation layers
- **CORS** — explicit origin allowlist only
- **Auto-delete** — uploaded and output files purged every 15 minutes

---

## 📦 Dependencies

### Server
| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `multer` | Multipart file upload |
| `pdf-lib` | Pure-JS PDF manipulation (merge, images, compress) |
| `pdf2pic` | PDF page rendering via GraphicsMagick |
| `sharp` | Image processing & optimization |
| `archiver` | ZIP creation for multi-page PDF→JPG |
| `node-cron` | Scheduled file cleanup |
| `helmet` | Security headers |
| `winston` | Structured logging |
| `uuid` | Unique filename generation |

### Client
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `react-dropzone` | Drag-and-drop file upload |
| `axios` | HTTP client with upload progress |
| `vite` | Build tool + dev server |
