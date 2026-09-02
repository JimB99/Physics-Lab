import { useEffect, useState } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  ariaLabel?: string;
}

function clamp(value: number, min?: number, max?: number): number {
  let out = value;
  if (min !== undefined && out < min) out = min;
  if (max !== undefined && out > max) out = max;
  return out;
}

export function NumberField({
  label,
  value,
  unit,
  onChange,
  disabled,
  min,
  max,
  integer = false,
  ariaLabel,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(() => String(value));

  useEffect(() => {
    setDraft((current) => (Number(current) === value ? current : String(value)));
  }, [value]);

  const handleChange = (raw: string) => {
    setDraft(raw);
    if (raw.trim() === '') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange(integer ? Math.round(parsed) : parsed);
  };

  const handleBlur = () => {
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const settled = clamp(integer ? Math.round(parsed) : parsed, min, max);
    setDraft(String(settled));
    if (settled !== value) onChange(settled);
  };

  return (
    <label className="field">
      {label !== '' && (
        <span className="field__label">
          {label}
          {unit && <span className="muted"> ({unit})</span>}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        className="field__input"
        value={draft}
        disabled={disabled}
        aria-label={ariaLabel ?? (label === '' ? undefined : label)}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
      />
    </label>
  );
}
