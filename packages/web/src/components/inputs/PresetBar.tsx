import { useNavigate, useLocation } from 'react-router-dom';
import type { ScenarioPreset } from '../../lib/scenarioPresets';

interface PresetBarProps {
  presets: ScenarioPreset[];
}

export function PresetBar({ presets }: PresetBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ marginBottom: '1rem' }}>
      <span className="muted" style={{ fontSize: '0.8rem' }}>
        Examples
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.description}
            style={{ textAlign: 'left', fontSize: '0.85rem' }}
            onClick={() => navigate(`${location.pathname}?${preset.query}`, { replace: true })}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
