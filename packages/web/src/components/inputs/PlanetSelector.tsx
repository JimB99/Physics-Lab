import type { PlanetId } from 'physics-engine';
import { PLANET_GRAVITY } from 'physics-engine';

interface PlanetSelectorProps {
  planet: PlanetId;
  customG: number;
  onPlanetChange: (planet: PlanetId) => void;
  onCustomGChange: (g: number) => void;
}

export function PlanetSelector({ planet, customG, onPlanetChange, onCustomGChange }: PlanetSelectorProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Planet / environment</label>
      <select
        value={planet}
        onChange={(e) => onPlanetChange(e.target.value as PlanetId)}
        style={{
          width: '100%',
          padding: '0.45rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        <option value="earth">Earth ({PLANET_GRAVITY.earth} m/s²)</option>
        <option value="moon">Moon ({PLANET_GRAVITY.moon} m/s²)</option>
        <option value="mars">Mars ({PLANET_GRAVITY.mars} m/s²)</option>
        <option value="custom">Custom</option>
      </select>
      {planet === 'custom' && (
        <label style={{ display: 'block', marginTop: '0.5rem' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>g (m/s²)</span>
          <input
            type="number"
            value={customG}
            step={0.01}
            min={0.01}
            onChange={(e) => onCustomGChange(parseFloat(e.target.value) || 9.80665)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </label>
      )}
    </div>
  );
}
