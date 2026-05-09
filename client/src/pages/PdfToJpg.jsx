import { useState, useEffect } from 'react';
import ToolPage from '../components/ToolPage.jsx';
import DropZone from '../components/DropZone.jsx';
import FileCard from '../components/FileCard.jsx';
import useConversion, { STATES } from '../hooks/useConversion.js';
import { convertPdfToJpg } from '../services/api.js';

const ACCEPT = { 'application/pdf': ['.pdf'] };

const TIPS = [
  'Multi-page PDFs are automatically packaged into a ZIP archive for download.',
  'Higher DPI (density) produces sharper images but larger file sizes.',
  'Quality 85 is the recommended balance between clarity and file size.',
  'Ideal for sharing specific PDF pages as images or creating thumbnails.',
];

export default function PdfToJpg() {
  const [file, setFile]       = useState(null);
  const [quality, setQuality] = useState('85');
  const [density, setDensity] = useState('150');
  const { state, uploadProgress, result, error, run, reset } = useConversion();

  useEffect(() => { document.title = 'PDF → JPG — FileConvert'; }, []);

  const handleFiles = (accepted, err) => { if (!err) setFile(accepted[0]); };
  const handleReset = () => { reset(); setFile(null); };

  const handleConvert = () => {
    if (!file) return;
    run((onProgress) =>
      convertPdfToJpg(file, { quality: parseInt(quality), density: parseInt(density) }, onProgress)
    );
  };

  return (
    <ToolPage
      title="PDF → JPG"
      subtitle="Render every page of your PDF as a high-quality JPEG image. Multi-page PDFs are zipped automatically."
      badge="JPEG Output"
      accentColor="#16A34A"
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

      {/* Options */}
      {file && (
        <>
          <div className="tool-options">
            <div className="tool-option-group">
              <label htmlFor="quality">Image Quality</label>
              <select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="60">60 — Small file size</option>
                <option value="75">75 — Balanced</option>
                <option value="85">85 — Recommended ✓</option>
                <option value="95">95 — High quality</option>
              </select>
            </div>
            <div className="tool-option-group">
              <label htmlFor="density">Resolution (DPI)</label>
              <select
                id="density"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
              >
                <option value="72">72 DPI — Screen</option>
                <option value="96">96 DPI — Standard</option>
                <option value="150">150 DPI — Recommended ✓</option>
                <option value="300">300 DPI — Print quality</option>
              </select>
            </div>
          </div>

          <div className="tool-action">
            <span className="tool-action__info">
              {density} DPI · Quality {quality}%
            </span>
            <button className="btn btn-primary btn-lg" onClick={handleConvert}>
              <ImgIcon />
              Convert to JPG
            </button>
          </div>
        </>
      )}
    </ToolPage>
  );
}

function ImgIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
      <path d="M21 15l-5-5L5 21"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
