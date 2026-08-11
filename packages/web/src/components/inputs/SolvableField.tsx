import { formatNumber } from 'physics-engine';
import { NumberField } from './NumberField';

export type FieldMode = 'given' | 'solve';

interface SolvableFieldProps {
  id: string;
  label: string;
  unit?: string;
  mode: FieldMode;
  value: number;
  solvedValue?: number;
  onModeChange: (mode: FieldMode) => void;
  onValueChange: (value: number) => void;
  min?: number;
  step?: number;
}

export function SolvableField({
  label,
  unit,
  mode,
  value,
  solvedValue,
  onModeChange,
  onValueChange,
  min,
  step,
}: SolvableFieldProps) {
  const displayValue = mode === 'solve' && solvedValue !== undefined ? solvedValue : value;

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.875rem' }}>
          {label}
          {unit && <span className="muted"> ({unit})</span>}
        </span>
        <span className={mode === 'given' ? 'badge-given' : 'badge-solve'}>
          {mode === 'given' ? 'Given' : 'Solve'}
        </span>
      </div>
      {mode === 'given' ? (
        <NumberField
          label=""
          value={value}
          onChange={onValueChange}
          min={min}
          step={step}
        />
      ) : (
        <div
          style={{
            padding: '0.45rem 0.6rem',
            border: '1px solid var(--solve)',
            borderRadius: 'var(--radius)',
            background: 'rgba(61, 214, 140, 0.08)',
            fontFamily: 'var(--mono)',
          }}
        >
          {solvedValue !== undefined ? formatNumber(solvedValue) : '—'}
          {unit && <span className="muted"> {unit}</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
        <button
          type="button"
          className={mode === 'given' ? 'active' : ''}
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => onModeChange('given')}
        >
          Given
        </button>
        <button
          type="button"
          className={mode === 'solve' ? 'active' : ''}
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => onModeChange('solve')}
        >
          Solve
        </button>
      </div>
      {mode === 'solve' && solvedValue !== undefined && (
        <input type="hidden" value={displayValue} />
      )}
    </div>
  );
}
