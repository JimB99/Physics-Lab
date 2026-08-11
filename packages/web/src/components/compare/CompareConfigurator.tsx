import type { VariantConfig, CompareScenario, CompareType } from '../../lib/compareDefaults';
import { planetLabel } from '../../lib/compareDefaults';
import { NumberField } from '../inputs/NumberField';
import type { CelestialBodyId } from 'physics-engine';
import { CELESTIAL_BODIES } from 'physics-engine';

interface CompareConfiguratorProps {
  scenario: CompareScenario;
  compareType: CompareType;
  variants: VariantConfig[];
  onScenarioChange: (s: CompareScenario) => void;
  onCompareTypeChange: (t: CompareType) => void;
  onVariantChange: (id: string, partial: Partial<VariantConfig>) => void;
  onAddVariant: () => void;
  onRemoveVariant: (id: string) => void;
}

export function CompareConfigurator({
  scenario,
  compareType,
  variants,
  onScenarioChange,
  onCompareTypeChange,
  onVariantChange,
  onAddVariant,
  onRemoveVariant,
}: CompareConfiguratorProps) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <label>
          Scenario{' '}
          <select
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value as CompareScenario)}
            style={{ marginLeft: '0.5rem', padding: '0.35rem' }}
          >
            <option value="vertical1d">Free fall / Vertical</option>
            <option value="projectile">Projectile</option>
          </select>
        </label>
        <label>
          Compare by{' '}
          <select
            value={compareType}
            onChange={(e) => onCompareTypeChange(e.target.value as CompareType)}
            style={{ marginLeft: '0.5rem', padding: '0.35rem' }}
          >
            <option value="environment">Environment</option>
            <option value="drag">Vacuum vs drag</option>
            {scenario === 'projectile' && <option value="angle">Launch angle</option>}
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {variants.map((v) => (
          <div key={v.id} className="card" style={{ borderColor: v.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: v.color }}>{v.label}</strong>
              {variants.length > 2 && (
                <button type="button" onClick={() => onRemoveVariant(v.id)} style={{ fontSize: '0.75rem' }}>
                  Remove
                </button>
              )}
            </div>
            {compareType === 'environment' && (
              <label style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Body
                <select
                  value={v.planet}
                  onChange={(e) => onVariantChange(v.id, { planet: e.target.value as CelestialBodyId })}
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.35rem' }}
                >
                  {CELESTIAL_BODIES.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
            )}
            {compareType === 'drag' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={v.dragEnabled}
                  onChange={(e) =>
                    onVariantChange(v.id, {
                      dragEnabled: e.target.checked,
                      label: e.target.checked ? `${v.id.toUpperCase()} (drag)` : `${v.id.toUpperCase()} (vacuum)`,
                    })
                  }
                />
                Air resistance on
              </label>
            )}
            {compareType === 'angle' && scenario === 'projectile' && (
              <NumberField label="Launch angle" unit="°" value={v.angle} min={0} onChange={(angle) => onVariantChange(v.id, { angle })} />
            )}
            <NumberField label="h₀" unit="m" value={v.h0} min={0} onChange={(h0) => onVariantChange(v.id, { h0 })} />
            <NumberField label="v₀" unit="m/s" value={v.v0} min={0} onChange={(v0) => onVariantChange(v.id, { v0 })} />
            {scenario === 'projectile' && compareType !== 'angle' && (
              <NumberField label="Angle" unit="°" value={v.angle} min={0} onChange={(angle) => onVariantChange(v.id, { angle })} />
            )}
            <p className="muted" style={{ fontSize: '0.75rem', margin: '0.5rem 0 0' }}>
              {planetLabel(v.planet)}
              {v.dragEnabled ? ' · with drag' : ''}
            </p>
          </div>
        ))}
      </div>
      {variants.length < 3 && (
        <button type="button" onClick={onAddVariant} style={{ marginTop: '1rem' }}>
          + Add variant C
        </button>
      )}
    </div>
  );
}
