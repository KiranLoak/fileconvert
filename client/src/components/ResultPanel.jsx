import './ResultPanel.css';

/**
 * ResultPanel — shown after a successful conversion.
 * Displays file details and download button.
 */
export default function ResultPanel({ result, tool, onConvertAnother }) {
  if (!result) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="result-panel animate-scale-in">
      {/* Success header */}
      <div className="result-panel__header">
        <div className="result-panel__check">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="var(--success)" />
            <path
              d="M7 12l3.5 3.5L17 9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="40"
              strokeDashoffset="0"
              style={{ animation: 'checkmark 0.4s ease forwards 0.1s' }}
            />
          </svg>
        </div>
        <div>
          <h3 className="result-panel__title">Conversion complete!</h3>
          <p className="result-panel__sub">Your file is ready to download</p>
        </div>
      </div>

      {/* File info */}
      <div className="result-panel__meta">
        <MetaRow icon={<FileIcon />} label="Output file" value={result.filename} mono />
        {result.sizeFormatted && (
          <MetaRow icon={<SizeIcon />} label="File size" value={result.sizeFormatted} />
        )}
        {result.pageCount && (
          <MetaRow icon={<PageIcon />} label="Pages" value={result.pageCount} />
        )}
        {result.savingsPercent !== undefined && (
          <MetaRow
            icon={<CompressIcon />}
            label="Size reduction"
            value={`${result.savingsPercent}% (${result.originalSize?.formatted} → ${result.compressedSize?.formatted})`}
          />
        )}
        {result.processingTimeMs && (
          <MetaRow icon={<TimeIcon />} label="Processed in" value={`${(result.processingTimeMs / 1000).toFixed(1)}s`} />
        )}
      </div>

      {/* Actions */}
      <div className="result-panel__actions">
        <button className="btn btn-primary btn-lg" onClick={handleDownload}>
          <DownloadIcon />
          Download {result.type === 'zip' ? 'ZIP Archive' : 'File'}
        </button>
        <button className="btn btn-secondary" onClick={onConvertAnother}>
          Convert another
        </button>
      </div>

      <p className="result-panel__expiry">
        File will be automatically deleted after 30 minutes.
      </p>
    </div>
  );
}

function MetaRow({ icon, label, value, mono }) {
  return (
    <div className="result-meta-row">
      <span className="result-meta-row__icon">{icon}</span>
      <span className="result-meta-row__label">{label}</span>
      <span className={`result-meta-row__value ${mono ? 'is-mono' : ''}`}>{value}</span>
    </div>
  );
}

// ── Mini icons ────────────────────────────────────────────────────
const iconProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
const stroke = { stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' };

const FileIcon     = () => <svg {...iconProps}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" {...stroke}/><path d="M14 2v6h6" {...stroke}/></svg>;
const SizeIcon     = () => <svg {...iconProps}><circle cx="12" cy="12" r="10" {...stroke}/><path d="M8 12h8M12 8v8" {...stroke}/></svg>;
const PageIcon     = () => <svg {...iconProps}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" {...stroke}/><rect x="9" y="3" width="6" height="4" rx="1" {...stroke}/></svg>;
const CompressIcon = () => <svg {...iconProps}><path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" {...stroke}/></svg>;
const TimeIcon     = () => <svg {...iconProps}><circle cx="12" cy="12" r="10" {...stroke}/><path d="M12 6v6l4 2" {...stroke}/></svg>;
const DownloadIcon = () => <svg {...iconProps}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" {...stroke}/></svg>;
