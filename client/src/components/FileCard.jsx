import './FileCard.css';

/**
 * FileCard — displays a selected file's name, size, and type icon.
 * Optionally shows a remove button.
 */
export default function FileCard({ file, onRemove, index }) {
  const ext = file.name.split('.').pop().toLowerCase();
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  const sizeStr = file.size < 1024 * 1024
    ? `${Math.round(file.size / 1024)} KB`
    : `${sizeMB} MB`;

  return (
    <div className="file-card animate-fade-up" style={{ animationDelay: `${(index || 0) * 60}ms` }}>
      <div className="file-card__icon">
        <FileIcon ext={ext} />
      </div>
      <div className="file-card__info">
        <p className="file-card__name" title={file.name}>{file.name}</p>
        <p className="file-card__meta">
          <span className="badge badge--neutral">{ext.toUpperCase()}</span>
          <span className="file-card__size">{sizeStr}</span>
        </p>
      </div>
      {onRemove && (
        <button
          className="file-card__remove"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function FileIcon({ ext }) {
  const colors = {
    pdf:  { bg: '#FEE2E2', fill: '#DC2626' },
    jpg:  { bg: '#DCFCE7', fill: '#16A34A' },
    jpeg: { bg: '#DCFCE7', fill: '#16A34A' },
    png:  { bg: '#E0F2FE', fill: '#0284C7' },
    webp: { bg: '#F3E8FF', fill: '#9333EA' },
    docx: { bg: '#DBEAFE', fill: '#2563EB' },
    doc:  { bg: '#DBEAFE', fill: '#2563EB' },
  };

  const c = colors[ext] || { bg: 'var(--bg-muted)', fill: 'var(--text-secondary)' };

  return (
    <div className="file-icon" style={{ background: c.bg }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          stroke={c.fill}
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M14 2v6h6" stroke={c.fill} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}
