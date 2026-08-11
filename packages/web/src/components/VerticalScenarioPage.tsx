import { useMemo, useState } from 'react';
import type { PlanetId } from 'physics-engine';
import { WorkspaceLayout } from './layout/WorkspaceLayout';
import { EnvironmentPanel } from './inputs/EnvironmentPanel';
import { SolvableField } from './inputs/SolvableField';
import { ResultsPanel } from './results/ResultsPanel';
import { SimulationCanvas } from './simulation/SimulationCanvas';
import { WorkspaceTabs } from './WorkspaceTabs';
import { useScenarioParams } from '../hooks/useScenarioParams';
import { useMotionScenario } from '../hooks/useMotionScenario';

const VERTICAL_FIELDS = ['h0', 'v0', 't', 'y', 'v', 'impactTime', 'impactVelocity', 'maxHeight', 'timeToMaxHeight'] as const;

const FIELD_LABELS: Record<string, { label: string; unit: string; default: number }> = {
  h0: { label: 'Initial height h₀', unit: 'm', default: 10 },
  v0: { label: 'Initial velocity v₀', unit: 'm/s', default: 0 },
  t: { label: 'Time t', unit: 's', default: 1 },
  y: { label: 'Height y', unit: 'm', default: 5 },
  v: { label: 'Velocity v', unit: 'm/s', default: -5 },
  impactTime: { label: 'Impact time', unit: 's', default: 0 },
  impactVelocity: { label: 'Impact velocity', unit: 'm/s', default: 0 },
  maxHeight: { label: 'Maximum height', unit: 'm', default: 0 },
  timeToMaxHeight: { label: 'Time to max height', unit: 's', default: 0 },
};

const DEFAULT_MODES: Record<string, 'given' | 'solve'> = {
  h0: 'given',
  v0: 'given',
  t: 'solve',
  y: 'solve',
  v: 'solve',
  impactTime: 'solve',
  impactVelocity: 'solve',
  maxHeight: 'solve',
  timeToMaxHeight: 'solve',
};

interface VerticalScenarioPageProps {
  title: string;
  description: string;
}

export function VerticalScenarioPage({ title, description }: VerticalScenarioPageProps) {
  const fullDefaults = useMemo(() => {
    const numeric = Object.fromEntries(VERTICAL_FIELDS.map((f) => [f, FIELD_LABELS[f]!.default]));
    return {
      ...numeric,
      planet: 'earth' as PlanetId,
      customG: 9.80665,
      mass: 1,
    } as Record<string, number | string>;
  }, []);

  const [values, urlModes, setValue, setMode] = useScenarioParams(fullDefaults);

  const modes = useMemo(() => {
    const m = { ...DEFAULT_MODES };
    for (const key of Object.keys(urlModes)) {
      if (key in m && urlModes[key]) m[key] = urlModes[key]!;
    }
    return m;
  }, [urlModes]);

  const planet = (values.planet as PlanetId) ?? 'earth';
  const customG = Number(values.customG) || 9.80665;
  const mass = Number(values.mass) || 1;

  const scenario = useMotionScenario({
    kind: 'vertical1d',
    values: values as unknown as Record<string, number>,
    modes,
    planet,
    customG,
    mass,
    fieldIds: [...VERTICAL_FIELDS],
  });

  const [highlightTime, setHighlightTime] = useState<number | undefined>();

  const solved = scenario.solveResult.status === 'solved' ? scenario.solveResult.values : {};
  const multi = scenario.solveResult.status === 'solved' ? scenario.solveResult.multiValues : undefined;

  const error =
    scenario.solveResult.status === 'underdetermined'
      ? scenario.solveResult.message + (scenario.solveResult.missing.length ? `: ${scenario.solveResult.missing.join(', ')}` : '')
      : scenario.solveResult.status === 'overconstrained'
        ? scenario.solveResult.message
        : scenario.solveResult.status === 'noSolution'
          ? scenario.solveResult.message
          : undefined;

  const resultItems = VERTICAL_FIELDS.filter((f) => modes[f] === 'solve').map((f) => ({
    label: FIELD_LABELS[f]!.label,
    value: solved[f],
    unit: FIELD_LABELS[f]!.unit,
    multi: f === 't' ? multi?.t : f === 'v' ? multi?.v : undefined,
  }));

  return (
    <WorkspaceLayout
      title={title}
      inputs={
        <div>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{description}</p>
          <EnvironmentPanel
            planet={planet}
            customG={customG}
            mass={mass}
            onPlanetChange={(p) => setValue('planet', p)}
            onCustomGChange={(g) => setValue('customG', g)}
            onMassChange={(m) => setValue('mass', m)}
          />
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Problem fields</h3>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Lock values you know; mark others as Solve.
          </p>
          {VERTICAL_FIELDS.map((f) => (
            <SolvableField
              key={f}
              id={f}
              label={FIELD_LABELS[f]!.label}
              unit={FIELD_LABELS[f]!.unit}
              mode={modes[f] ?? 'solve'}
              value={(values[f] as number) ?? FIELD_LABELS[f]!.default}
              solvedValue={solved[f]}
              onModeChange={(m) => setMode(f, m)}
              onValueChange={(v) => setValue(f, v)}
            />
          ))}
        </div>
      }
      simulation={
        <SimulationCanvas
          samples={scenario.samples}
          highlightTime={highlightTime}
          onTimeChange={setHighlightTime}
        />
      }
      results={
        <ResultsPanel
          items={resultItems}
          error={error}
          hint={scenario.env ? `g = ${scenario.env.g} m/s²` : undefined}
        />
      }
      tabs={
        <WorkspaceTabs
          samples={scenario.samples}
          solveResult={scenario.solveResult}
          g={scenario.env.g}
          mass={scenario.env.mass}
        />
      }
    />
  );
}
