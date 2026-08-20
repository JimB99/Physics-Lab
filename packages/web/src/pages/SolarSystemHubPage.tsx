import { Link } from 'react-router-dom';

const modules = [
  {
    to: '/solar-system/planet-calendar',
    title: 'Planet Calendar',
    desc: 'Heliocentric positions, fast cluster finder, and animation using VSOP87 ephemeris.',
  },
  {
    to: '/solar-system/moon-phases',
    title: 'Moon Phases',
    desc: 'Current lunar phase, illumination, and upcoming new/full/quarter events.',
  },
];

export function SolarSystemHubPage() {
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Solar System</h1>
      <p className="muted">
        Orbital mechanics complements the motion scenarios, which still use constant surface gravity only.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        {modules.map((module) => (
          <Link key={module.to} to={module.to} className="card" style={{ display: 'block' }}>
            <h3 style={{ margin: '0 0 0.35rem' }}>{module.title}</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              {module.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
