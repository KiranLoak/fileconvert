import { Link } from 'react-router-dom';
import './Footer.css';

const TOOLS = [
  { label: 'PDF → Word',   to: '/pdf-to-word' },
  { label: 'PDF → JPG',    to: '/pdf-to-jpg' },
  { label: 'JPG → PDF',    to: '/jpg-to-pdf' },
  { label: 'Merge PDF',    to: '/merge-pdf' },
  { label: 'Compress PDF', to: '/compress-pdf' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__brand-name">FileConvert</span>
          <p className="footer__tagline">
            Fast, private file conversion — files deleted after 30 minutes.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Footer navigation">
          <p className="footer__nav-label">Tools</p>
          {TOOLS.map((t) => (
            <Link key={t.to} to={t.to} className="footer__nav-link">
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="container footer__bottom">
        <p className="footer__copy">
          © {new Date().getFullYear()} FileConvert. Built for speed and privacy.
        </p>
        <p className="footer__note">
          Files are processed server-side and never stored permanently.
        </p>
      </div>
    </footer>
  );
}
