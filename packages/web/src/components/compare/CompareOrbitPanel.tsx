import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { CelestialBodyId, OrbitalPlanetId } from 'physics-engine';
import { getSolarSystemSnapshot, todayUtcDate } from 'physics-engine';
import { buildPlanetCalendarLink } from '../../hooks/usePlanetCalendarParams';
import { planetLabel } from '../../lib/compareDefaults';

interface CompareOrbitPanelProps {
  orbitDate: Date;
  onDateChange: (date: Date) => void;
  planets: CelestialBodyId[];
}

export function CompareOrbitPanel({ orbitDate, onDateChange, planets }: CompareOrbitPanelProps) {
  const snapshot = useMemo(
    () => getSolarSystemSnapshot(orbitDate, 'true'),
    [orbitDate],
  );

  const uniquePlanets = [...new Set(planets.filter((p) => p !== 'custom'))];

  const dateInputValue = `${orbitDate.getUTCFullYear()}-${String(orbitDate.getUTCMonth() + 1).padStart(2, '0')}-${String(orbitDate.getUTCDate()).padStart(2, '0')}`;

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Orbit date</h3>
      <p className="muted" style={{ fontSize: '0.9rem' }}>
        Heliocentric positions for each variant&apos;s planet on the chosen date (true AU).
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <input
          type="date"
          value={dateInputValue}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number);
            if (y && m && d) onDateChange(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
          }}
          style={{ padding: '0.45rem' }}
        />
        <button type="button" onClick={() => onDateChange(todayUtcDate())}>
          Today (UTC)
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr className="muted">
              <th style={{ textAlign: 'left', padding: '0.35rem' }}>Variant planet</th>
              <th style={{ textAlign: 'right', padding: '0.35rem' }}>λ (°)</th>
              <th style={{ textAlign: 'right', padding: '0.35rem' }}>r (AU)</th>
              <th style={{ textAlign: 'right', padding: '0.35rem' }}>Link</th>
            </tr>
          </thead>
          <tbody>
            {uniquePlanets.map((planetId) => {
              const row = snapshot.positions.find((p) => p.id === planetId);
              if (!row) {
                return (
                  <tr key={planetId}>
                    <td style={{ padding: '0.35rem' }}>{planetLabel(planetId)}</td>
                    <td colSpan={3} className="muted" style={{ padding: '0.35rem' }}>
                      Not in solar-system view
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={planetId}>
                  <td style={{ padding: '0.35rem' }}>{planetLabel(planetId)}</td>
                  <td style={{ textAlign: 'right', padding: '0.35rem' }}>{row.longitudeDeg.toFixed(1)}</td>
                  <td style={{ textAlign: 'right', padding: '0.35rem' }}>{row.distanceAu.toFixed(3)}</td>
                  <td style={{ textAlign: 'right', padding: '0.35rem' }}>
                    <Link
                      to={buildPlanetCalendarLink({
                        highlight: planetId as OrbitalPlanetId,
                        date: orbitDate,
                      })}
                    >
                      Calendar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
