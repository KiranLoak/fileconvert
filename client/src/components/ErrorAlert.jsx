import './ErrorAlert.css';

export default function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-alert animate-fade-up" role="alert">
      <div className="error-alert__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="error-alert__msg">{message}</p>
      {onDismiss && (
        <button className="error-alert__dismiss" onClick={onDismiss} aria-label="Dismiss error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
