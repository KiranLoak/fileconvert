import { useState, useEffect } from 'react';
import ToolPage from '../components/ToolPage.jsx';
import DropZone from '../components/DropZone.jsx';
import FileCard from '../components/FileCard.jsx';
import useConversion, { STATES } from '../hooks/useConversion.js';
import { convertJpgToPdf } from '../services/api.js';
import './JpgToPdf.css';

const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/webp': ['.webp'],
};

const TIPS = [
  'Upload multiple images to combine them into a single multi-page PDF.',
  'Images are placed in the order shown — drag to reorder (coming soon).',
  'Landscape images automatically rotate the PDF page to fit.',
  'Supports JPG, PNG, and WebP formats up to 50MB each.',
];

export default function JpgToPdf() {
  const [files, setFiles] = useState([]);
  const { state, uploadProgress, result, error, run, reset } = useConversion();

  useEffect(() => { document.title = 'JPG → PDF — FileConvert'; }, []);

  const handleFiles = (accepted, err) => {
    if (err) return;
    // Merge new files, deduplicate by name+size
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}_${f.size}`));
      const newFiles = accepted.filter((f) => !existing.has(`${f.name}_${f.size}`));
      return [...prev, ...newFiles].slice(0, 20); // max 20
    });
  };

  const handleRemove = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => { reset(); setFiles([]); };

  const handleConvert = () => {
    if (files.length === 0) return;
    run((onProgress) => convertJpgToPdf(files, onProgress));
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeStr = totalSize < 1024 * 1024
    ? `${Math.round(totalSize / 1024)} KB`
    : `${(totalSize / 1024 / 1024).toFixed(1)} MB`;

  return (
    <ToolPage
      title="JPG → PDF"
      subtitle="Combine one or more images into a single PDF. Each image becomes its own page, scaled to fit."
      badge="PDF Output"
      accentColor="#D97706"
      conversionState={state}
      uploadProgress={uploadProgress}
      result={result}
      error={error}
      onReset={handleReset}
      tips={TIPS}
    >
      <DropZone
        onFiles={handleFiles}
        accept={ACCEPT}
        multiple={true}
        maxFiles={20}
        maxSize={50 * 1024 * 1024}
        disabled={state !== STATES.IDLE}
        hint="JPG, PNG, WebP — up to 20 images, 50MB each"
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="jpg-pdf__files">
          <div className="jpg-pdf__files-header">
            <span className="jpg-pdf__files-count">
              {files.length} image{files.length !== 1 ? 's' : ''} · {totalSizeStr}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFiles([])}
              type="button"
            >
              Clear all
            </button>
          </div>
          <div className="jpg-pdf__files-list">
            {files.map((file, i) => (
              <FileCard
                key={`${file.name}_${file.size}_${i}`}
                file={file}
                onRemove={() => handleRemove(i)}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="tool-action">
          <span className="tool-action__info">
            {files.length} page{files.length !== 1 ? 's' : ''} in output PDF
          </span>
          <button className="btn btn-primary btn-lg" onClick={handleConvert}>
            <PdfIcon />
            Create PDF
          </button>
        </div>
      )}
    </ToolPage>
  );
}

function PdfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}
