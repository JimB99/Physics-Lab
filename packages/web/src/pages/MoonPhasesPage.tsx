import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  findUpcomingPhases,
  formatDateString,
  formatMoonEvent,
  getMoonPhase,
  todayUtcDate,
} from 'physics-engine';
import { MoonPhaseCanvas } from '../components/solar-system/MoonPhaseCanvas';

export function MoonPhasesPage() {
  const [date, setDate] = useState(() => todayUtcDate());

  const phase = useMemo(() => getMoonPhase(date), [date]);
  const upcoming = useMemo(() => findUpcomingPhases(date, 8), [date]);

  return (
    <div style={{ padding: '1rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Moon Phases</h1>
      <p className="muted">
        Geocentric lunar phase from the Sun–Moon ecliptic longitude difference (VSOP87 / astronomy-engine).
      </p>
      <Link to="/solar-system" className="muted" style={{ fontSize: '0.85rem' }}>
        ← Solar System hub
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Current phase</h2>
          <label style={{ display: 'block', marginBottom: '1rem' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Date (UTC noon)</span>
            <input
              type="date"
              value={`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split('-').map(Number);
                if (y && m && d) {
                  setDate(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
                }
              }}
              style={{ width: '100%', marginTop: '0.25rem', padding: '0.45rem' }}
            />
          </label>
          <button type="button" onClick={() => setDate(todayUtcDate())} style={{ marginBottom: '1rem' }}>
            Today (UTC)
          </button>
          <MoonPhaseCanvas phase={phase} />
          <p style={{ textAlign: 'center', marginBottom: 0 }}>
            <strong>{phase.name}</strong>
          </p>
          <p className="muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            {(phase.illuminationFraction * 100).toFixed(1)}% illuminated · λ☉☽ = {phase.phaseAngleDeg.toFixed(1)}°
          </p>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Upcoming events</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr className="muted">
                <th style={{ textAlign: 'left', padding: '0.35rem' }}>Phase</th>
                <th style={{ textAlign: 'right', padding: '0.35rem' }}>Date (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((event) => (
                <tr key={`${event.name}-${event.date.getTime()}`}>
                  <td style={{ padding: '0.35rem' }}>{event.name}</td>
                  <td style={{ textAlign: 'right', padding: '0.35rem' }}>{formatDateString(event.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            Next event: {upcoming[0] ? formatMoonEvent(upcoming[0]) : '—'}
          </p>
          <Link to="/solar-system/planet-calendar" style={{ fontSize: '0.9rem' }}>
            Open Planet Calendar →
          </Link>
        </section>
      </div>
    </div>
  );
}
