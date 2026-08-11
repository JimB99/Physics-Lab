import { formatNumber } from 'physics-engine';
import type { SolveStep } from 'physics-engine';

interface SubstitutionLineProps {
  step: SolveStep;
}

export function SubstitutionLine({ step }: SubstitutionLineProps) {
  return (
    <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
      <div className="muted">{step.description}</div>
      <div style={{ fontFamily: 'var(--mono)' }}>
        {step.equation} → <strong>{step.field}</strong> = {formatNumber(step.result)}
      </div>
    </div>
  );
}

interface SolveStepsListProps {
  steps: SolveStep[];
}

export function SolveStepsList({ steps }: SolveStepsListProps) {
  if (steps.length === 0) return <p className="muted">No solve steps yet.</p>;
  return (
    <div>
      {steps.map((s, i) => (
        <SubstitutionLine key={`${s.field}-${i}`} step={s} />
      ))}
    </div>
  );
}
