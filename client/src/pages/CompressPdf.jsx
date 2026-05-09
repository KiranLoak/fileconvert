import { useState, useEffect } from 'react';
import ToolPage from '../components/ToolPage.jsx';
import DropZone from '../components/DropZone.jsx';
import FileCard from '../components/FileCard.jsx';
import useConversion, { STATES } from '../hooks/useConversion.js';
import { compressPdf } from '../services/api.js';
import './CompressPdf.css';

const ACCEPT = { 'application/pdf': ['.pdf'] };

const LEVELS = [
  {
    value: 'low',
    label: 'Maximum',
    description: 'Smallest file — best for email or web sharing',
    icon: '🗜️',
    badge: 'Smallest',
  },
  {
    value: 'medium',
    label: 'Balanced',
    description: 'Good quality at reduced size — recommended',
    icon: '⚖️',
    badge: 'Recommended',
  },
  {
    value: 'high',
    label: 'Light',
    description: 'Near-original quality — minimal compression',
    icon: '🖨️',
    badge: 'Best quality',
  },
];

const TIPS = [
  'PDFs with many images benefit most from compression.',
  'Text-only PDFs are already compact and may not compress significantly.',
  '"Maximum" compression is ideal for sharing via email or messaging apps.',
  '"Light" compression preserves quality for professional printing.',
];

export default function CompressPdf() {
  const [file, setFile]   = useState(null);
  const [level, setLevel] = useState('medium');
  const { state, uploadProgress, result, error, run, reset } = useConversion();

  useEffect(() => { document.title = 'Compress PDF — FileConvert'; }, []);

  const handleFiles = (accepted, err) => { if (!err) setFile(accepted[0]); };
  const handleReset = () => { reset(); setFile(null); };

  const handleConvert = () => {
    if (!file) return;
    run((onProgress) => compressPdf(file, level, onProgress));
  };

  return (
    <ToolPage
      title="Compress PDF"
      subtitle="Reduce your PDF file size while maintaining readability. Choose a compression level to match your needs."
      badge="PDF Optimizer"
      accentColor="#DC2626"
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
        multiple={false}
        maxSize={50 * 1024 * 1024}
        disabled={state !== STATES.IDLE}
        hint="PDF files up to 50MB"
      />

      {file && <FileCard file={file} onRemove={() => setFile(null)} index={0} />}

      {/* Compression level picker */}
      {file && (
        <>
          <div className="compress__levels">
            <p className="compress__levels-label">Compression Level</p>
            <div className="compress__levels-grid">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  type="button"
                  className={`compress__level-btn ${level === lvl.value ? 'is-active' : ''}`}
                  onClick={() => setLevel(lvl.value)}
                  aria-pressed={level === lvl.value}
                >
                  <span className="compress__level-icon">{lvl.icon}</span>
                  <span className="compress__level-text">
                    <span className="compress__level-name">{lvl.label}</span>
                    <span className="compress__level-desc">{lvl.description}</span>
                  </span>
                  {level === lvl.value && (
                    <span className="compress__level-check">
                      <CheckIcon />
                    </span>
                  )}
                  {lvl.badge && (
                    <span className="compress__level-badge">{lvl.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-action">
            <span className="tool-action__info">
              Using {LEVELS.find((l) => l.value === level)?.label.toLowerCase()} compression
            </span>
            <button className="btn btn-primary btn-lg" onClick={handleConvert}>
              <CompressIcon />
              Compress PDF
            </button>
          </div>
        </>
      )}
    </ToolPage>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 8v8M9 11l3-3 3 3" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
