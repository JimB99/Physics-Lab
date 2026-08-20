import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/motion', label: 'Motion' },
  { to: '/solar-system', label: 'Solar System' },
  { to: '/compare', label: 'Compare' },
];

export function NavBar() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <strong style={{ fontSize: '1.1rem' }}>Physics Lab</strong>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
