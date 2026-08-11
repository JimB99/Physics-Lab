interface NumberFieldProps {
  label: string;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  step?: number;
}

export function NumberField({ label, value, unit, onChange, disabled, min, step = 0.01 }: NumberFieldProps) {
  return (
    <label style={{ display: 'block', marginBottom: '0.75rem' }}>
      <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
        {label}
        {unit && <span className="muted"> ({unit})</span>}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        disabled={disabled}
        min={min}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </label>
  );
}
