import { useState } from 'react';
import type { AtmospherePresetId, ShapePresetId } from 'physics-engine';
import { ATMOSPHERE_PRESETS, SHAPE_PRESETS, resolveAtmosphere, terminalVelocity } from 'physics-engine';
import { NumberField } from './NumberField';

export interface DragSettings {
  enabled: boolean;
  atmospherePreset: AtmospherePresetId;
  customRho: number;
  shape: ShapePresetId;
  cd: number;
  area: number;
}

interface DragPanelProps {
  settings: DragSettings;
  mass: number;
  g: number;
  onChange: (settings: DragSettings) => void;
}

export function DragPanel({ settings, mass, g, onChange }: DragPanelProps) {
  const [open, setOpen] = useState(false);

  const update = (partial: Partial<DragSettings>) => onChange({ ...settings, ...partial });

  const atmosphere = resolveAtmosphere(settings.atmospherePreset, settings.customRho, settings.enabled);
  const effectiveRho = atmosphere.rho;
  const vacuumPreset = settings.enabled && effectiveRho <= 0;

  const vt =
    settings.enabled && settings.area > 0 && effectiveRho > 0
      ? terminalVelocity(mass, g, effectiveRho, settings.cd, settings.area)
      : null;

  return (
    <div className="panel-section">
      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? '▼' : '▶'} Air resistance
      </button>
      {open && (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
            />
            Enable air resistance
          </label>
          {settings.enabled && (
            <>
              <p className="error" style={{ fontSize: '0.8rem' }}>
                Flexible solve disabled while air resistance is on. Use forward simulation.
              </p>
              {vacuumPreset && (
                <p className="error" style={{ fontSize: '0.8rem' }}>
                  The selected atmosphere has ρ = 0, so there is no drag. Choose Earth or Mars, or
                  pick Custom and enter a density.
                </p>
              )}
              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Atmosphere</span>
                <select
                  value={settings.atmospherePreset}
                  onChange={(e) => {
                    const preset = e.target.value as AtmospherePresetId;
                    const rho = preset === 'custom' ? settings.customRho : ATMOSPHERE_PRESETS[preset as keyof typeof ATMOSPHERE_PRESETS]?.rho ?? 0;
                    update({ atmospherePreset: preset, customRho: rho });
                  }}
                  className="select"
                >
                  {Object.entries(ATMOSPHERE_PRESETS).map(([id, p]) => (
                    <option key={id} value={id}>{p.label} (ρ = {p.rho} kg/m³)</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
              {settings.atmospherePreset === 'custom' && (
                <NumberField label="Air density ρ" unit="kg/m³" value={settings.customRho} min={0} step={0.001} onChange={(v) => update({ customRho: v })} />
              )}
              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Object shape</span>
                <select
                  value={settings.shape}
                  onChange={(e) => {
                    const shape = e.target.value as ShapePresetId;
                    const preset = SHAPE_PRESETS.find((s) => s.id === shape);
                    update({ shape, cd: preset?.cd ?? settings.cd });
                  }}
                  className="select"
                >
                  {SHAPE_PRESETS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label} (Cd ≈ {s.cd})</option>
                  ))}
                </select>
              </label>
              <NumberField label="Cross-sectional area A" unit="m²" value={settings.area} min={0.0001} step={0.001} onChange={(v) => update({ area: v })} />
              <NumberField label="Drag coefficient Cd" unit="" value={settings.cd} min={0.01} step={0.01} onChange={(cd) => update({ cd, shape: 'custom' })} />
              {vt !== null && Number.isFinite(vt) && (
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  Terminal velocity ≈ {vt.toFixed(1)} m/s at ρ = {effectiveRho} kg/m³
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
