import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle('Physics Lab');
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Physics Lab</h1>
      <p>
        Interactive physics calculations, simulations, equations, and visualizations.
        Enter what you know — the app solves for the rest.
      </p>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
        <Link to="/motion" className="card" style={{ display: 'block' }}>
          <h2 style={{ margin: '0 0 0.5rem' }}>Motion under gravity</h2>
          <p className="muted" style={{ margin: 0 }}>
            Free fall, vertical throw, and projectile motion with graphs, equations, and animation.
          </p>
        </Link>
        <Link to="/compare" className="card" style={{ display: 'block' }}>
          <h2 style={{ margin: '0 0 0.5rem' }}>Comparison Mode</h2>
          <p className="muted" style={{ margin: 0 }}>
            Compare Earth vs Moon, vacuum vs drag, or different launch angles side by side.
          </p>
        </Link>
        <Link to="/solar-system" className="card" style={{ display: 'block' }}>
          <h2 style={{ margin: '0 0 0.5rem' }}>Solar System</h2>
          <p className="muted" style={{ margin: 0 }}>
            Planet calendar, moon phases, fast cluster search, and orbital animation (VSOP87).
          </p>
        </Link>
      </div>
    </div>
  );
}
