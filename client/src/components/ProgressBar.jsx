import './ProgressBar.css';

/**
 * ProgressBar — shows upload/conversion progress.
 *
 * Props:
 *   value   - 0–100 (undefined = indeterminate)
 *   label   - text above bar
 *   variant - 'upload' | 'processing' | 'success' | 'error'
 */
export default function ProgressBar({ value, label, variant = 'upload' }) {
  const isIndeterminate = value === undefined || value === null;
  const pct = isIndeterminate ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div className={`progress-wrap progress-wrap--${variant}`}>
      {label && (
        <div className="progress-header">
          <span className="progress-label">{label}</span>
          {!isIndeterminate && variant !== 'success' && variant !== 'error' && (
            <span className="progress-pct">{pct}%</span>
          )}
          {variant === 'success' && <CheckIcon />}
          {variant === 'error' && <XIcon />}
        </div>
      )}
      <div
        className={`progress-track ${isIndeterminate ? 'is-indeterminate' : ''}`}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="progress-fill"
          style={isIndeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="var(--success)" />
      <path
        d="M5 8l2 2 4-4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="var(--error)" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
