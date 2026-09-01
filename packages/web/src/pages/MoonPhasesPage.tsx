import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  findUpcomingQuarters,
  formatIsoDate,
  formatIsoDateTime,
  formatMoonEvent,
  getMoonPhase,
  parseIsoDate,
  todayUtcDate,
} from 'physics-engine';
import { MoonPhaseCanvas } from '../components/solar-system/MoonPhaseCanvas';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const EVENT_COUNT = 8;

export function MoonPhasesPage() {
  useDocumentTitle('Moon Phases');
  const [searchParams, setSearchParams] = useSearchParams();

  const date = useMemo(() => {
    const param = searchParams.get('date');
    return (param !== null ? parseIsoDate(param) : null) ?? todayUtcDate();
  }, [searchParams]);

  const setDate = (next: Date) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set('date', formatIsoDate(next));
        return params;
      },
      { replace: true },
    );
  };

  const phase = useMemo(() => getMoonPhase(date), [date]);
  const upcoming = useMemo(() => findUpcomingQuarters(date, EVENT_COUNT), [date]);

  return (
    <div className="page">
      <h1>Moon Phases</h1>
      <p className="muted">
        Geocentric lunar phase from the Sun–Moon ecliptic longitude difference, with the illuminated
        fraction from astronomy-engine&apos;s illumination model.
      </p>
      <Link to="/solar-system" className="muted" style={{ fontSize: '0.85rem' }}>
        ← Solar System hub
      </Link>

      <div className="card-grid">
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Current phase</h2>
          <label className="field">
            <span className="field__label muted">Date (UTC noon)</span>
            <input
              type="date"
              className="field__input"
              value={formatIsoDate(date)}
              onChange={(e) => {
                const parsed = parseIsoDate(e.target.value);
                if (parsed) setDate(parsed);
              }}
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
            {(phase.illuminationFraction * 100).toFixed(1)}% illuminated · λ☉☽ ={' '}
            {phase.phaseAngleDeg.toFixed(1)}°
          </p>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Upcoming quarters</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr className="muted">
                <th style={{ textAlign: 'left', padding: '0.35rem' }}>Phase</th>
                <th style={{ textAlign: 'right', padding: '0.35rem' }}>Instant (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((event) => (
                <tr key={event.date.getTime()}>
                  <td style={{ padding: '0.35rem' }}>{event.name}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '0.35rem',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    {formatIsoDateTime(event.date)}
                  </td>
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
