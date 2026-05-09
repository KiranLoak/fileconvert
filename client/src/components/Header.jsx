import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import './Header.css';

const NAV_LINKS = [
  { label: 'PDF → Word',     to: '/pdf-to-word' },
  { label: 'PDF → JPG',      to: '/pdf-to-jpg' },
  { label: 'JPG → PDF',      to: '/jpg-to-pdf' },
  { label: 'Merge PDF',      to: '/merge-pdf' },
  { label: 'Compress PDF',   to: '/compress-pdf' },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="container header__inner">
        {/* Brand */}
        <Link to="/" className="header__brand">
          <BrandIcon />
          <span className="header__brand-name">FileConvert</span>
        </Link>

        {/* Nav */}
        <nav className="header__nav" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`header__nav-link ${location.pathname === link.to ? 'is-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="header__actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function BrandIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="7" fill="var(--accent)" />
      <path
        d="M7 9h9l4 4v7H7V9z"
        stroke="white"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M16 9v4h4" stroke="white" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <path
        d="M12 18l1.5 1.5L17 15"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
