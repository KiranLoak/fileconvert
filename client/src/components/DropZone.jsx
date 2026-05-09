import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './DropZone.css';

/**
 * DropZone — Drag-and-drop file upload area.
 *
 * Props:
 *   onFiles(FileList)   — called with accepted files
 *   accept             — react-dropzone accept object { 'application/pdf': ['.pdf'] }
 *   multiple           — allow multiple files
 *   maxFiles           — max files allowed
 *   maxSize            — max bytes per file
 *   disabled           — disable interaction
 *   hint               — helper text below the icon
 */
export default function DropZone({
  onFiles,
  accept,
  multiple = false,
  maxFiles = 1,
  maxSize = 50 * 1024 * 1024,
  disabled = false,
  hint,
}) {
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        const messages = {
          'file-too-large':       `File is too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB.`,
          'file-invalid-type':    'Invalid file type. Please check the accepted formats.',
          'too-many-files':       `Too many files. Maximum: ${maxFiles}.`,
        };
        // Surface the first error through a custom event — parent handles it
        onFiles([], messages[err.code] || err.message);
        return;
      }
      if (acceptedFiles.length > 0) {
        onFiles(acceptedFiles, null);
      }
    },
    [onFiles, maxFiles, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
    maxSize,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={[
        'dropzone',
        isDragActive  ? 'is-dragging'  : '',
        isDragReject  ? 'is-rejected'  : '',
        disabled      ? 'is-disabled'  : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input {...getInputProps()} />

      <div className="dropzone__content">
        {/* Icon */}
        <div className="dropzone__icon-wrap">
          {isDragReject ? <RejectIcon /> : isDragActive ? <DropIcon /> : <UploadIcon />}
        </div>

        {/* Copy */}
        <div className="dropzone__text">
          {isDragReject ? (
            <p className="dropzone__primary text-error">This file type isn&apos;t supported</p>
          ) : isDragActive ? (
            <p className="dropzone__primary text-accent">Drop to upload</p>
          ) : (
            <>
              <p className="dropzone__primary">
                Drag &amp; drop your file{multiple ? '(s)' : ''} here
              </p>
              <p className="dropzone__secondary">
                or{' '}
                <span className="dropzone__browse">click to browse</span>
              </p>
            </>
          )}
        </div>

        {/* Hint */}
        {hint && !isDragActive && !isDragReject && (
          <p className="dropzone__hint">{hint}</p>
        )}
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--accent-subtle)" />
      <path
        d="M20 25V15M20 15l-4 4M20 15l4 4"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 27h14"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--accent)" />
      <path
        d="M20 14v12M14 20l6 6 6-6"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--error-subtle)" />
      <path
        d="M15 15l10 10M25 15l-10 10"
        stroke="var(--error)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
