import { Link } from 'react-router-dom';
import './ToolCard.css';

/**
 * ToolCard — clickable card on the Home page.
 * Props: icon, title, description, to (route), badge, accent (CSS color)
 */
export default function ToolCard({ icon, title, description, to, badge, accent }) {
  return (
    <Link to={to} className="tool-card" style={{ '--card-accent': accent }}>
      <div className="tool-card__icon-wrap">
        {icon}
      </div>
      <div className="tool-card__body">
        <div className="tool-card__header">
          <h3 className="tool-card__title">{title}</h3>
          {badge && <span className="badge badge--neutral tool-card__badge">{badge}</span>}
        </div>
        <p className="tool-card__desc">{description}</p>
      </div>
      <div className="tool-card__arrow" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
