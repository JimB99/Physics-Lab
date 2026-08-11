import { Link } from 'react-router-dom';

const scenarios = [
  { to: '/motion/free-fall', title: 'Free Fall', desc: 'Drop or fall from height' },
  { to: '/motion/vertical-throw', title: 'Vertical Throw', desc: 'Throw up or down' },
  { to: '/motion/projectile', title: 'Projectile Motion', desc: 'Launch at an angle' },
];

export function MotionHubPage() {
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
