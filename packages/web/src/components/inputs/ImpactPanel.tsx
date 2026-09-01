import { useState } from 'react';
import type { ImpactModel, ImpactResult } from 'physics-engine';
import { computeImpact, formatNumber } from 'physics-engine';
import { NumberField } from './NumberField';

interface ImpactPanelProps {
  enabled: boolean;
  model: ImpactModel;
  stoppingTime: number;
  stoppingDistance: number;
  contactArea: number;
  impactSpeed: number | undefined;
  mass: number;
  onEnabledChange: (v: boolean) => void;
  onModelChange: (m: ImpactModel) => void;
  onStoppingTimeChange: (v: number) => void;
  onStoppingDistanceChange: (v: number) => void;
  onContactAreaChange: (v: number) => void;
}

export function ImpactPanel({
  enabled,
  model,
  stoppingTime,
  stoppingDistance,
  contactArea,
  impactSpeed,
  mass,
  onEnabledChange,
  onModelChange,
  onStoppingTimeChange,
  onStoppingDistanceChange,
  onContactAreaChange,
}: ImpactPanelProps) {
  const [open, setOpen] = useState(enabled);

  const result: ImpactResult | null =
    enabled && impactSpeed !== undefined && impactSpeed > 0
      ? (() => {
          const out = computeImpact({
            mass,
            impactSpeed,
            model,
            stoppingTime: model === 'stoppingTime' ? stoppingTime : undefined,
            stoppingDistance: model === 'stoppingDistance' ? stoppingDistance : undefined,
            contactArea: contactArea > 0 ? contactArea : undefined,
          });
          return 'averageForce' in out ? out : null;
        })()
      : null;

  return (
    <div className="panel-section">
      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? '▼' : '▶'} Impact analysis
      </button>
      {open && (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} />
            Enable impact analysis
          </label>
          {enabled && (
            <>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Impact speed: {impactSpeed !== undefined ? `${formatNumber(impactSpeed)} m/s` : '—'}
              </p>
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Model</span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    className={model === 'stoppingTime' ? 'active' : ''}
                    aria-pressed={model === 'stoppingTime'}
                    onClick={() => onModelChange('stoppingTime')}
                  >
                    Stopping time
                  </button>
                  <button
                    type="button"
                    className={model === 'stoppingDistance' ? 'active' : ''}
                    aria-pressed={model === 'stoppingDistance'}
                    onClick={() => onModelChange('stoppingDistance')}
                  >
                    Stopping distance
                  </button>
                </div>
              </div>
              {model === 'stoppingTime' && (
                <NumberField label="Stopping time Δt" unit="s" value={stoppingTime} min={0.0001} step={0.001} onChange={onStoppingTimeChange} />
              )}
              {model === 'stoppingDistance' && (
                <NumberField label="Stopping distance d" unit="m" value={stoppingDistance} min={0.0001} step={0.001} onChange={onStoppingDistanceChange} />
              )}
              <NumberField label="Contact area A (optional)" unit="m²" value={contactArea} min={0} step={0.001} onChange={onContactAreaChange} />
              <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Average force over stopping interval — not peak force.
              </p>
              {result && (
                <div style={{ marginTop: '0.75rem', fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
                  <div>F_avg = {formatNumber(result.averageForce)} N</div>
                  <div>a_impact = {formatNumber(result.impactAcceleration)} m/s²</div>
                  <div>G_impact = {formatNumber(result.impactGForce)} g</div>
                  {result.pressure !== undefined && <div>P = {formatNumber(result.pressure)} Pa</div>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
