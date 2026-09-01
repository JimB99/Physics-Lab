import type { CelestialBodyId } from 'physics-engine';
import { CELESTIAL_BODIES } from 'physics-engine';
import { Link } from 'react-router-dom';
import { buildPlanetCalendarLink } from '../../hooks/usePlanetCalendarParams';
import { NumberField } from './NumberField';

interface PlanetSelectorProps {
  planet: CelestialBodyId;
  customG: number;
  onPlanetChange: (planet: CelestialBodyId) => void;
  onCustomGChange: (g: number) => void;
}

const planets = CELESTIAL_BODIES.filter((b) => b.kind === 'planet');
const moons = CELESTIAL_BODIES.filter((b) => b.kind === 'moon');
const stars = CELESTIAL_BODIES.filter((b) => b.kind === 'star');

export function PlanetSelector({ planet, customG, onPlanetChange, onCustomGChange }: PlanetSelectorProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Celestial body</label>
      <select value={planet} onChange={(e) => onPlanetChange(e.target.value as CelestialBodyId)} className="select">
        <optgroup label="Planets">
          {planets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.surfaceGravity} m/s²)
            </option>
          ))}
        </optgroup>
        <optgroup label="Moons">
          {moons.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.surfaceGravity} m/s²)
            </option>
          ))}
        </optgroup>
        <optgroup label="Stars">
          {stars.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.surfaceGravity} m/s²)
            </option>
          ))}
        </optgroup>
        <option value="custom">Custom</option>
      </select>
      {planet !== 'custom' && planet !== 'moon' && (
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          <Link to={buildPlanetCalendarLink({ highlight: planet })}>View orbital position →</Link>
        </p>
      )}
      {planet === 'sun' && (
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
          Motion scenarios use surface gravity (274 m/s²). See Solar System for heliocentric orbits.
        </p>
      )}
      {planet === 'custom' && (
        <NumberField
          label="g"
          unit="m/s²"
          value={customG}
          min={0.01}
          onChange={onCustomGChange}
        />
      )}
    </div>
  );
}
