import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const scenarios = [
  { to: '/motion/free-fall', title: 'Free Fall', desc: 'Released from rest — v₀ is fixed at 0' },
  { to: '/motion/vertical-throw', title: 'Vertical Throw', desc: 'Thrown up or down with any v₀' },
  { to: '/motion/projectile', title: 'Projectile Motion', desc: 'Launched at an angle in 2D' },
];

export function MotionHubPage() {
  useDocumentTitle('Motion');
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Motion</h1>
      <p className="muted">
        Mark any values as <span className="badge-given">Given</span> and others as{' '}
        <span className="badge-solve">Solve</span>. The idealized model uses constant g and no air resistance.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {scenarios.map((s) => (
          <Link key={s.to} to={s.to} className="card" style={{ display: 'block' }}>
            <h3 style={{ margin: '0 0 0.35rem' }}>{s.title}</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
