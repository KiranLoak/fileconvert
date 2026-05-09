import { useState, useEffect } from 'react';
import ToolPage from '../components/ToolPage.jsx';
import DropZone from '../components/DropZone.jsx';
import FileCard from '../components/FileCard.jsx';
import useConversion, { STATES } from '../hooks/useConversion.js';
import { convertPdfToWord } from '../services/api.js';

const ACCEPT = { 'application/pdf': ['.pdf'] };

const TIPS = [
  'For best results, use text-based PDFs rather than scanned documents.',
  'Scanned PDFs require OCR and may have reduced accuracy.',
  'Complex multi-column layouts may need minor formatting adjustments after conversion.',
  'File size limit: 50MB per file.',
];

export default function PdfToWord() {
  const [file, setFile] = useState(null);
  const { state, uploadProgress, result, error, run, reset } = useConversion();

  useEffect(() => { document.title = 'PDF → Word — FileConvert'; }, []);

  const handleFiles = (accepted, err) => {
    if (err) return;
    setFile(accepted[0]);
  };

  const handleRemove = () => setFile(null);

  const handleConvert = () => {
    if (!file) return;
    run((onProgress) => convertPdfToWord(file, onProgress));
  };

  const handleReset = () => { reset(); setFile(null); };

  return (
    <ToolPage
      title="PDF → Word"
      subtitle="Convert PDF documents to editable DOCX files. Powered by LibreOffice for accurate layout preservation."
      badge="DOCX Output"
      accentColor="#2563EB"
      conversionState={state}
      uploadProgress={uploadProgress}
      result={result}
      error={error}
      onReset={handleReset}
      tips={TIPS}
    >
      {/* Drop zone */}
      <DropZone
        onFiles={handleFiles}
        accept={ACCEPT}
        multiple={false}
        maxSize={50 * 1024 * 1024}
        disabled={state !== STATES.IDLE}
        hint="PDF files up to 50MB"
      />

      {/* Selected file */}
      {file && (
        <FileCard
          file={file}
          onRemove={handleRemove}
          index={0}
        />
      )}

      {/* Action */}
      {file && (
        <div className="tool-action">
          <span className="tool-action__info">
            LibreOffice headless conversion
          </span>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleConvert}
            disabled={!file}
          >
            <ConvertIcon />
            Convert to Word
          </button>
        </div>
      )}
    </ToolPage>
  );
}

function ConvertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 2v6h6M9 13l1.5 4 1.5-3 1.5 3 1.5-4"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
