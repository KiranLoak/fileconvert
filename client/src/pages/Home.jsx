import { useEffect } from 'react';
import ToolCard from '../components/ToolCard.jsx';
import './Home.css';

const TOOLS = [
  {
    to: '/pdf-to-word',
    title: 'PDF → Word',
    description: 'Convert PDF documents to editable DOCX files using LibreOffice — preserves layout and text accurately.',
    accent: '#2563EB',
    icon: <WordIcon />,
  },
  {
    to: '/pdf-to-jpg',
    title: 'PDF → JPG',
    description: 'Render every page of a PDF as a high-quality JPEG image. Multi-page PDFs are zipped automatically.',
    accent: '#16A34A',
    icon: <JpgIcon />,
  },
  {
    to: '/jpg-to-pdf',
    title: 'JPG → PDF',
    description: 'Combine one or more images (JPG, PNG, WebP) into a single PDF document. Each image gets its own page.',
    accent: '#D97706',
    icon: <PdfIcon />,
  },
  {
    to: '/merge-pdf',
    title: 'Merge PDF',
    description: 'Drag and reorder multiple PDF files, then merge them into a single perfectly-ordered PDF.',
    accent: '#9333EA',
    icon: <MergeIcon />,
  },
  {
    to: '/compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining readability. Choose compression level to match your quality needs.',
    accent: '#DC2626',
    icon: <CompressIcon />,
  },
];

const FEATURES = [
  { icon: <LockIcon />, title: 'Private by default', body: 'Files are processed and deleted within 30 minutes. Nothing is stored permanently.' },
  { icon: <BoltIcon />, title: 'Fast conversion',     body: 'Async processing pipeline handles even large PDFs quickly and reliably.' },
  { icon: <FreeIcon />, title: 'Free to use',         body: 'No sign-up, no watermarks, no subscription. Just convert and download.' },
];

export default function Home() {
  useEffect(() => { document.title = 'FileConvert — PDF & Image Tools'; }, []);

  return (
    <div className="home page">
      <div className="container">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="home-hero animate-fade-up">
          <div className="home-hero__eyebrow">
            <span className="page-hero__badge">
              <FlashIcon /> Free &amp; Open Source
            </span>
          </div>
          <h1 className="home-hero__title">
            Convert files<br />
            <span className="home-hero__title-accent">without the fuss</span>
          </h1>
          <p className="home-hero__sub">
            A clean, fast toolkit for PDF and image conversion.
            No sign-up, no ads, no watermarks — just results.
          </p>
        </section>

        {/* ── Tool Grid ─────────────────────────────────────────── */}
        <section className="home-tools" aria-label="Available tools">
          <div className="home-tools__grid">
            {TOOLS.map((tool, i) => (
              <div
                key={tool.to}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 70 + 100}ms` }}
              >
                <ToolCard {...tool} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section className="home-features">
          <hr className="divider" />
          <div className="home-features__grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="home-feature animate-fade-up"
                style={{ animationDelay: `${i * 80 + 500}ms` }}
              >
                <div className="home-feature__icon">{f.icon}</div>
                <div>
                  <h4 className="home-feature__title">{f.title}</h4>
                  <p className="home-feature__body">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── SVG icons for tools ─────────────────────────────────────── */
const s = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
const p = (color) => ({ stroke: color, strokeWidth: '1.6', strokeLinecap: 'round', strokeLinejoin: 'round' });

function WordIcon()     { return <svg {...s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" {...p('#2563EB')}/><path d="M14 2v6h6M9 13l1.5 4 1.5-3 1.5 3 1.5-4" {...p('#2563EB')}/></svg>; }
function JpgIcon()      { return <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2" {...p('#16A34A')}/><circle cx="8.5" cy="8.5" r="1.5" fill="#16A34A"/><path d="M21 15l-5-5L5 21" {...p('#16A34A')}/></svg>; }
function PdfIcon()      { return <svg {...s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" {...p('#D97706')}/><path d="M14 2v6h6M9 17v-5h2a2 2 0 010 4H9" {...p('#D97706')}/></svg>; }
function MergeIcon()    { return <svg {...s}><path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" {...p('#9333EA')}/><path d="M12 8v8M8 12h8" {...p('#9333EA')}/></svg>; }
function CompressIcon() { return <svg {...s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" {...p('#DC2626')}/><path d="M14 2v6h6M9 13h6M9 17h4" {...p('#DC2626')}/></svg>; }
function FlashIcon()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }
function LockIcon()     { return <svg {...s}><rect x="3" y="11" width="18" height="11" rx="2" {...p('currentColor')}/><path d="M7 11V7a5 5 0 0110 0v4" {...p('currentColor')}/></svg>; }
function BoltIcon()     { return <svg {...s}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" {...p('currentColor')}/></svg>; }
function FreeIcon()     { return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p('currentColor')}/></svg>; }
