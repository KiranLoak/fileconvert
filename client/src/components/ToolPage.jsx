import ProgressBar from './ProgressBar.jsx';
import ErrorAlert from './ErrorAlert.jsx';
import ResultPanel from './ResultPanel.jsx';
import { STATES } from '../hooks/useConversion.js';
import './ToolPage.css';

/**
 * ToolPage — Shared layout wrapper for every conversion tool page.
 *
 * Handles: hero section, conversion state display (progress/result/error),
 * and the main upload panel slot.
 *
 * Props:
 *   title, subtitle, badge, accentColor
 *   conversionState  — from useConversion()
 *   uploadProgress
 *   result, error
 *   onReset
 *   children         — the upload form (dropzone + options + button)
 *   tips             — array of tip strings
 */
export default function ToolPage({
  title,
  subtitle,
  badge,
  accentColor,
  conversionState,
  uploadProgress,
  result,
  error,
  onReset,
  children,
  tips,
}) {
  const isIdle       = conversionState === STATES.IDLE;
  const isUploading  = conversionState === STATES.UPLOADING;
  const isProcessing = conversionState === STATES.PROCESSING;
  const isBusy       = isUploading || isProcessing;
  const isDone       = conversionState === STATES.DONE;
  const isError      = conversionState === STATES.ERROR;

  return (
    <div className="tool-page page">
      <div className="container container--narrow">
        {/* Hero */}
        <div className="page-hero animate-fade-up">
          {badge && (
            <div className="page-hero__badge" style={{ '--badge-color': accentColor }}>
              {badge}
            </div>
          )}
          <h1 className="page-hero__title">{title}</h1>
          <p className="page-hero__sub">{subtitle}</p>
        </div>

        {/* Main panel */}
        <div className="tool-page__panel animate-fade-up" style={{ animationDelay: '80ms' }}>
          {/* Idle / Upload form */}
          {(isIdle || isError) && (
            <div className="tool-page__upload-area">
              {children}
              {isError && error && (
                <ErrorAlert message={error} onDismiss={onReset} />
              )}
            </div>
          )}

          {/* Busy state */}
          {isBusy && (
            <div className="tool-page__progress">
              <div className="tool-page__progress-icon">
                <Spinner color={accentColor} />
              </div>
              <div className="tool-page__progress-bars">
                <ProgressBar
                  value={isUploading ? uploadProgress : undefined}
                  label={isUploading ? 'Uploading…' : undefined}
                  variant={isUploading ? 'upload' : undefined}
                />
                {isProcessing && (
                  <ProgressBar
                    label="Converting… this may take a moment"
                    variant="processing"
                  />
                )}
              </div>
              <p className="tool-page__progress-note">
                Do not close this tab while converting.
              </p>
            </div>
          )}

          {/* Done */}
          {isDone && result && (
            <ResultPanel
              result={result}
              onConvertAnother={onReset}
            />
          )}
        </div>

        {/* Tips */}
        {tips && tips.length > 0 && (isIdle || isError) && (
          <div className="tool-tips animate-fade-up" style={{ animationDelay: '160ms' }}>
            <h4 className="tool-tips__heading">Tips</h4>
            <ul className="tool-tips__list">
              {tips.map((tip, i) => (
                <li key={i} className="tool-tips__item">
                  <span className="tool-tips__dot" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner({ color }) {
  return (
    <svg
      width="36" height="36" viewBox="0 0 36 36" fill="none"
      style={{ animation: 'spin 0.9s linear infinite' }}
      aria-label="Loading"
    >
      <circle cx="18" cy="18" r="15" stroke="var(--bg-muted)" strokeWidth="3" />
      <path
        d="M18 3 a15 15 0 0 1 15 15"
        stroke={color || 'var(--accent)'}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
