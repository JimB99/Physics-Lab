import { useMemo, useState } from 'react';
import type { PlanetId } from 'physics-engine';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { EnvironmentPanel } from '../components/inputs/EnvironmentPanel';
import { SolvableField } from '../components/inputs/SolvableField';
import { ResultsPanel } from '../components/results/ResultsPanel';
import { SimulationCanvas } from '../components/simulation/SimulationCanvas';
import { WorkspaceTabs } from '../components/WorkspaceTabs';
import { useScenarioParams } from '../hooks/useScenarioParams';
import { useMotionScenario } from '../hooks/useMotionScenario';

const PROJECTILE_FIELDS = [
  'h0', 'v0', 'angle', 't', 'x', 'y', 'range', 'flightTime',
  'maxHeight', 'impactVelocity', 'impactAngle', 'timeToMaxHeight',
] as const;

const FIELD_LABELS: Record<string, { label: string; unit: string; default: number }> = {
  h0: { label: 'Initial height h₀', unit: 'm', default: 0 },
  v0: { label: 'Launch speed v₀', unit: 'm/s', default: 20 },
  angle: { label: 'Launch angle θ', unit: '°', default: 45 },
  t: { label: 'Time t', unit: 's', default: 1 },
  x: { label: 'Horizontal position x', unit: 'm', default: 0 },
  y: { label: 'Height y', unit: 'm', default: 0 },
  range: { label: 'Range', unit: 'm', default: 0 },
  flightTime: { label: 'Flight time', unit: 's', default: 0 },
  maxHeight: { label: 'Maximum height', unit: 'm', default: 0 },
  impactVelocity: { label: 'Impact speed', unit: 'm/s', default: 0 },
  impactAngle: { label: 'Impact angle', unit: '°', default: 0 },
  timeToMaxHeight: { label: 'Time to max height', unit: 's', default: 0 },
};

const DEFAULT_MODES: Record<string, 'given' | 'solve'> = {
  h0: 'given',
  v0: 'given',
  angle: 'given',
  t: 'solve',
  x: 'solve',
  y: 'solve',
  range: 'solve',
  flightTime: 'solve',
  maxHeight: 'solve',
  impactVelocity: 'solve',
  impactAngle: 'solve',
  timeToMaxHeight: 'solve',
};

export function ProjectilePage() {
  const fullDefaults = useMemo(() => {
    const numeric = Object.fromEntries(PROJECTILE_FIELDS.map((f) => [f, FIELD_LABELS[f]!.default]));
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
    kind: 'projectile',
    values: values as unknown as Record<string, number>,
    modes,
    planet,
    customG,
    mass,
    fieldIds: [...PROJECTILE_FIELDS],
  });

  const [highlightTime, setHighlightTime] = useState<number | undefined>();

  const solved = scenario.solveResult.status === 'solved' ? scenario.solveResult.values : {};

  const error =
    scenario.solveResult.status !== 'solved' ? scenario.solveResult.message : undefined;

  const resultItems = PROJECTILE_FIELDS.filter((f) => modes[f] === 'solve').map((f) => ({
    label: FIELD_LABELS[f]!.label,
    value: solved[f],
    unit: FIELD_LABELS[f]!.unit,
  }));

  return (
    <WorkspaceLayout
      title="Projectile Motion"
      inputs={
        <div>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Object launched at an angle under gravity.
          </p>
          <EnvironmentPanel
            planet={planet}
            customG={customG}
            mass={mass}
            onPlanetChange={(p) => setValue('planet', p)}
            onCustomGChange={(g) => setValue('customG', g)}
            onMassChange={(m) => setValue('mass', m)}
          />
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Problem fields</h3>
          {PROJECTILE_FIELDS.map((f) => (
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
          isProjectile
          highlightTime={highlightTime}
          onTimeChange={setHighlightTime}
        />
      }
      results={<ResultsPanel items={resultItems} error={error} hint={`g = ${scenario.env.g} m/s²`} />}
      tabs={
        <WorkspaceTabs
          samples={scenario.samples}
          solveResult={scenario.solveResult}
          isProjectile
          g={scenario.env.g}
          mass={scenario.env.mass}
        />
      }
    />
  );
}
