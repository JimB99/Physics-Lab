import { useNavigate, useLocation } from 'react-router-dom';
import type { ScenarioPreset } from '../../lib/scenarioPresets';

interface PresetBarProps {
  presets: ScenarioPreset[];
}

export function PresetBar({ presets }: PresetBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <label className="field" style={{ marginBottom: '0.75rem' }}>
      <span className="field__label muted">Examples</span>
      <select
        className="select"
        defaultValue=""
        onChange={(event) => {
          const preset = presets.find((item) => item.id === event.target.value);
          if (!preset) return;
          navigate(`${location.pathname}?${preset.query}`, { replace: true });
          event.currentTarget.value = '';
        }}
      >
        <option value="" disabled>
          Load an example…
        </option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id} title={preset.description}>
            {preset.label}
          </option>
        ))}
      </select>
    </label>
  );
}
