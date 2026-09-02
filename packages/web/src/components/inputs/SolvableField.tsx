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
  return (
    <div className="solvable-field">
      <div className="solvable-field__head">
        <span className="solvable-field__label">
          {label}
          {unit && <span className="muted"> ({unit})</span>}
        </span>
        <div className="mode-toggle">
          <button
            type="button"
            className={mode === 'given' ? 'active' : ''}
            aria-pressed={mode === 'given'}
            onClick={() => onModeChange('given')}
          >
            Given
          </button>
          <button
            type="button"
            className={mode === 'solve' ? 'active' : ''}
            aria-pressed={mode === 'solve'}
            onClick={() => onModeChange('solve')}
          >
            Solve
          </button>
        </div>
      </div>
      {mode === 'given' ? (
        <NumberField
          label=""
          ariaLabel={label}
          value={value}
          onChange={onValueChange}
          min={min}
          step={step}
        />
      ) : (
        <div className="solvable-field__solved">
          {solvedValue !== undefined ? formatNumber(solvedValue) : '—'}
          {unit && <span className="muted"> {unit}</span>}
        </div>
      )}
    </div>
  );
}
