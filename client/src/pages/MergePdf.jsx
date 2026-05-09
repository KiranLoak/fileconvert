import { useState, useEffect, useRef } from 'react';
import ToolPage from '../components/ToolPage.jsx';
import DropZone from '../components/DropZone.jsx';
import useConversion, { STATES } from '../hooks/useConversion.js';
import { mergePdfs } from '../services/api.js';
import './MergePdf.css';

const ACCEPT = { 'application/pdf': ['.pdf'] };

const TIPS = [
  'Upload at least 2 PDF files. Pages are merged in the order shown.',
  'Drag the handles to reorder files before merging.',
  'Up to 20 PDFs can be merged in a single operation.',
  'Encrypted or password-protected PDFs may be skipped.',
];

export default function MergePdf() {
  const [files, setFiles]       = useState([]);
  const [dragIdx, setDragIdx]   = useState(null);
  const [overIdx, setOverIdx]   = useState(null);
  const { state, uploadProgress, result, error, run, reset } = useConversion();

  useEffect(() => { document.title = 'Merge PDF — FileConvert'; }, []);

  const handleFiles = (accepted, err) => {
    if (err) return;
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}_${f.size}`));
      const newFiles = accepted.filter((f) => !existing.has(`${f.name}_${f.size}`));
      return [...prev, ...newFiles].slice(0, 20);
    });
  };

  const handleRemove = (i) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleReset = () => { reset(); setFiles([]); };

  const handleConvert = () => {
    if (files.length < 2) return;
    run((onProgress) => mergePdfs(files, onProgress));
  };

  /* ── Drag-to-reorder ───────────────────────────────────── */
  const onDragStart = (e, i) => {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, i) => {
    e.preventDefault();
    setOverIdx(i);
  };

  const onDrop = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const reordered = [...files];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    setFiles(reordered);
    setDragIdx(null);
    setOverIdx(null);
  };

  const onDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const totalSizeStr = totalSize < 1024 * 1024
    ? `${Math.round(totalSize / 1024)} KB`
    : `${(totalSize / 1024 / 1024).toFixed(1)} MB`;

  return (
    <ToolPage
      title="Merge PDF"
      subtitle="Combine multiple PDF files into a single document. Drag to reorder pages before merging."
      badge="Merge Tool"
      accentColor="#9333EA"
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
        hint="PDF files only · Up to 20 files · 50MB each"
      />

      {/* Sortable file list */}
      {files.length > 0 && (
        <div className="merge__list-wrap">
          <div className="merge__list-header">
            <span className="merge__list-count">
              {files.length} file{files.length !== 1 ? 's' : ''} · {totalSizeStr}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setFiles([])} type="button">
              Clear all
            </button>
          </div>

          <ol className="merge__list">
            {files.map((file, i) => {
              const sizeMB = file.size < 1024 * 1024
                ? `${Math.round(file.size / 1024)} KB`
                : `${(file.size / 1024 / 1024).toFixed(1)} MB`;

              return (
                <li
                  key={`${file.name}_${file.size}_${i}`}
                  className={[
                    'merge__item',
                    'animate-fade-up',
                    dragIdx === i ? 'is-dragging' : '',
                    overIdx === i && dragIdx !== i ? 'is-over' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ animationDelay: `${i * 40}ms` }}
                  draggable
                  onDragStart={(e) => onDragStart(e, i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={(e) => onDrop(e, i)}
                  onDragEnd={onDragEnd}
                >
                  {/* Drag handle */}
                  <span className="merge__handle" aria-label="Drag to reorder">
                    <DragIcon />
                  </span>

                  {/* Order number */}
                  <span className="merge__order">{i + 1}</span>

                  {/* PDF icon */}
                  <div className="merge__file-icon">
                    <PdfIcon />
                  </div>

                  {/* Info */}
                  <div className="merge__file-info">
                    <p className="merge__file-name" title={file.name}>{file.name}</p>
                    <p className="merge__file-meta">{sizeMB}</p>
                  </div>

                  {/* Remove */}
                  <button
                    className="merge__remove"
                    onClick={() => handleRemove(i)}
                    aria-label={`Remove ${file.name}`}
                    type="button"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {files.length >= 2 && (
        <div className="tool-action">
          <span className="tool-action__info">
            {files.length} PDFs will be merged in order
          </span>
          <button className="btn btn-primary btn-lg" onClick={handleConvert}>
            <MergeIcon />
            Merge PDFs
          </button>
        </div>
      )}

      {files.length === 1 && (
        <p className="merge__need-more">
          Add at least one more PDF to merge.
        </p>
      )}
    </ToolPage>
  );
}

const DragIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
const PdfIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#9333EA" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 2v6h6" stroke="#9333EA" strokeWidth="1.6" strokeLinejoin="round"/></svg>;
const MergeIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
