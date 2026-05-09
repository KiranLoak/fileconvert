/**
 * API Service
 * Centralized axios wrapper for all conversion endpoints.
 * Handles upload progress, error normalization, and response parsing.
 */

import axios from 'axios';

// In dev: Vite proxies /api → http://localhost:5000
// In prod: same origin, no proxy needed
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300_000, // 5 min — large files can take a while
});

/**
 * Normalize an axios error into a user-readable message.
 */
function parseError(err) {
  if (err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err.response?.status === 413) {
    return 'File is too large. Please use a smaller file.';
  }
  if (err.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (err.code === 'ECONNABORTED') {
    return 'Request timed out. The file may be too large or the server is busy.';
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'No internet connection. Please check your network.';
  }
  return err.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Resolve an output URL — handles both absolute URLs (with BASE_URL set on server)
 * and relative paths (/outputs/filename) returned in production.
 */
export function resolveOutputUrl(url) {
  if (!url) return url;
  // Already absolute
  if (url.startsWith('http')) return url;
  // Relative path — prepend current origin
  return `${window.location.origin}${url}`;
}

/**
 * Generic conversion request.
 * @param {string}   endpoint  - e.g. '/convert/pdf-to-word'
 * @param {FormData} formData
 * @param {function} onProgress - (percent: number) => void
 */
async function convert(endpoint, formData, onProgress) {
  try {
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      },
    });

    const data = response.data.data;
    // Ensure download URL is always absolute so the browser can navigate to it
    if (data?.url) data.url = resolveOutputUrl(data.url);

    return { success: true, data };
  } catch (err) {
    return { success: false, error: parseError(err) };
  }
}

// ── Typed conversion helpers ──────────────────────────────────────────────────

export const convertPdfToWord = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return convert('/convert/pdf-to-word', form, onProgress);
};

export const convertPdfToJpg = (file, options = {}, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  if (options.quality) form.append('quality', String(options.quality));
  if (options.density) form.append('density', String(options.density));
  return convert('/convert/pdf-to-jpg', form, onProgress);
};

export const convertJpgToPdf = (files, onProgress) => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return convert('/convert/jpg-to-pdf', form, onProgress);
};

export const mergePdfs = (files, onProgress) => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return convert('/convert/merge-pdf', form, onProgress);
};

export const compressPdf = (file, level = 'medium', onProgress) => {
  const form = new FormData();
  form.append('file', file);
  form.append('level', level);
  return convert('/convert/compress-pdf', form, onProgress);
};

export const checkHealth = () =>
  api.get('/health').then((r) => r.data).catch(() => null);

export default api;
