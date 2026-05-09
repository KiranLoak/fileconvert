# ═══════════════════════════════════════════════════════════════
# FileConvert — Dockerfile
#
# Multi-stage build:
#   Stage 1 (builder): Install Node deps + build React frontend
#   Stage 2 (runner):  Install system tools + copy build artifacts
#
# System tools installed:
#   - LibreOffice   → PDF → Word
#   - Ghostscript   → Compress PDF
#   - GraphicsMagick → PDF → JPG (via pdf2pic)
#   - Poppler-utils → pdfinfo (page count)
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package files for both server and client
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all Node dependencies
RUN npm install --prefix server --omit=dev && \
    npm install --prefix client

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Build the React frontend into client/dist
RUN npm run build --prefix client

# ── Stage 2: Production runtime ───────────────────────────────
FROM node:20-bookworm-slim AS runner

# Install system tools
# We pin to specific apt packages and clean up afterward to keep image lean
RUN apt-get update && apt-get install -y --no-install-recommends \
    # LibreOffice for PDF → Word
    libreoffice \
    # Ghostscript for PDF compression
    ghostscript \
    # GraphicsMagick for PDF → JPG (pdf2pic dependency)
    graphicsmagick \
    # Poppler for pdfinfo (page counting)
    poppler-utils \
    # Fonts — improves LibreOffice output quality
    fonts-liberation \
    fonts-dejavu-core \
    # Clean up apt lists to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* /var/tmp/*

WORKDIR /app

# Copy Node modules from builder (already installed, no need to reinstall)
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy application source
COPY --from=builder /app/server ./server

# Copy the compiled React frontend
COPY --from=builder /app/client/dist ./client/dist

# Create upload and output directories with correct permissions
RUN mkdir -p server/uploads server/outputs server/logs && \
    chmod 755 server/uploads server/outputs server/logs

# Create a non-root user for security
RUN groupadd --gid 1001 nodeuser && \
    useradd --uid 1001 --gid nodeuser --shell /bin/bash --create-home nodeuser && \
    chown -R nodeuser:nodeuser /app

USER nodeuser

# Expose the port Express listens on
EXPOSE 5000

# Health check — Railway/Render will restart the container if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the Express server
CMD ["node", "server/server.js"]
