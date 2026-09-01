import { useMemo, useState } from 'react';
import type { CelestialBodyId } from 'physics-engine';
import { resolveAtmosphere } from 'physics-engine';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { EnvironmentPanel } from '../components/inputs/EnvironmentPanel';
import { DragPanel } from '../components/inputs/DragPanel';
import { ImpactPanel } from '../components/inputs/ImpactPanel';
import { SolvableField } from '../components/inputs/SolvableField';
import { ResultsPanel } from '../components/results/ResultsPanel';
import { ResultsActions } from '../components/results/ResultsActions';
import { PresetBar } from '../components/inputs/PresetBar';
import { PROJECTILE_PRESETS } from '../lib/scenarioPresets';
import { SimulationCanvas } from '../components/simulation/SimulationCanvas';
import { WorkspaceTabs } from '../components/WorkspaceTabs';
import { useScenarioParams } from '../hooks/useScenarioParams';
import { useMotionScenario } from '../hooks/useMotionScenario';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDragSettings } from '../hooks/useDragSettings';
import { useImpactSettings } from '../hooks/useImpactSettings';

const PROJECTILE_FIELDS = [
  'h0', 'v0', 'angle', 'vx', 'vy', 't', 'x', 'y', 'v', 'range', 'flightTime',
  'maxHeight', 'impactVelocity', 'impactAngle', 'timeToMaxHeight',
] as const;

const FIELD_LABELS: Record<string, { label: string; unit: string; default: number }> = {
  h0: { label: 'Initial height h₀', unit: 'm', default: 0 },
  v0: { label: 'Launch speed v₀', unit: 'm/s', default: 20 },
  angle: { label: 'Launch angle θ', unit: '°', default: 45 },
  vx: { label: 'Horizontal velocity vₓ', unit: 'm/s', default: 14.14 },
  vy: { label: 'Vertical velocity v_y', unit: 'm/s', default: 14.14 },
  t: { label: 'Time t', unit: 's', default: 1 },
  x: { label: 'Horizontal position x', unit: 'm', default: 0 },
  y: { label: 'Height y', unit: 'm', default: 0 },
  v: { label: 'Speed at time t', unit: 'm/s', default: 0 },
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
  vx: 'solve',
  vy: 'solve',
  t: 'solve',
  x: 'solve',
  y: 'solve',
  v: 'solve',
  range: 'solve',
  flightTime: 'solve',
  maxHeight: 'solve',
  impactVelocity: 'solve',
  impactAngle: 'solve',
  timeToMaxHeight: 'solve',
};

export function ProjectilePage() {
  useDocumentTitle('Projectile Motion');
  const [dragSettings, setDragSettings] = useDragSettings();
  const [impact, setImpact] = useImpactSettings();

  const fullDefaults = useMemo(() => {
    const numeric = Object.fromEntries(PROJECTILE_FIELDS.map((f) => [f, FIELD_LABELS[f]!.default]));
    return {
      ...numeric,
      planet: 'earth' as CelestialBodyId,
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

  const planet = (values.planet as CelestialBodyId) ?? 'earth';
  const rawCustomG = Number(values.customG);
  const rawMass = Number(values.mass);
  const customG = Number.isFinite(rawCustomG) ? rawCustomG : 9.80665;
  const mass = Number.isFinite(rawMass) ? rawMass : 1;

  const scenario = useMotionScenario({
    kind: 'projectile',
    values: values as unknown as Record<string, number>,
    modes,
    planet,
    customG,
    mass,
    fieldIds: [...PROJECTILE_FIELDS],
    dragSettings,
  });

  const [highlightTime, setHighlightTime] = useState<number | undefined>();

  const solved = scenario.solveResult.status === 'solved' ? scenario.solveResult.values : {};

  const multi = scenario.solveResult.status === 'solved' ? scenario.solveResult.multiValues : undefined;

  const error = scenario.dragEnabled
    ? undefined
    : scenario.solveResult.status === 'underdetermined'
      ? scenario.solveResult.message +
        (scenario.solveResult.missing.length ? `: ${scenario.solveResult.missing.join(', ')}` : '')
      : scenario.solveResult.status === 'overconstrained'
        ? `${scenario.solveResult.message} (${scenario.solveResult.conflicts.join('; ')})`
        : scenario.solveResult.status === 'noSolution'
          ? scenario.solveResult.message
          : undefined;

  const resultItems = PROJECTILE_FIELDS.filter((f) => modes[f] === 'solve').map((f) => ({
    label: FIELD_LABELS[f]!.label,
    value: solved[f],
    unit: FIELD_LABELS[f]!.unit,
    multi: multi?.[f],
  }));

  if (scenario.dragEnabled && scenario.energyLost !== undefined) {
    resultItems.push({ label: 'Energy lost to drag', value: scenario.energyLost, unit: 'J', multi: undefined });
  }

  const impactSpeed = scenario.summary?.impactSpeed;

  return (
    <WorkspaceLayout
      title="Projectile Motion"
      inputs={
        <div>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Object launched at an angle under gravity.
          </p>
          <PresetBar presets={PROJECTILE_PRESETS} />
          <EnvironmentPanel
            planet={planet}
            customG={customG}
            mass={mass}
            onPlanetChange={(p) => setValue('planet', p)}
            onCustomGChange={(g) => setValue('customG', g)}
            onMassChange={(m) => setValue('mass', m)}
          />
          <DragPanel settings={dragSettings} mass={mass} g={scenario.env.g} onChange={setDragSettings} />
          <ImpactPanel
            enabled={impact.enabled}
            model={impact.model}
            stoppingTime={impact.stoppingTime}
            stoppingDistance={impact.stoppingDistance}
            contactArea={impact.contactArea}
            impactSpeed={impactSpeed}
            mass={mass}
            onEnabledChange={(enabled) => setImpact({ enabled })}
            onModelChange={(model) => setImpact({ model })}
            onStoppingTimeChange={(stoppingTime) => setImpact({ stoppingTime })}
            onStoppingDistanceChange={(stoppingDistance) => setImpact({ stoppingDistance })}
            onContactAreaChange={(contactArea) => setImpact({ contactArea })}
          />
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Problem fields</h3>
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
          flightTime={scenario.summary?.flightTime}
        />
      }
      results={
        <ResultsPanel
          items={resultItems}
          error={error}
          hint={`g = ${scenario.env.g} m/s²`}
          actions={<ResultsActions samples={scenario.samples} csvBasename="physics-lab-projectile" />}
        />
      }
      tabs={
        <WorkspaceTabs
          samples={scenario.samples}
          vacuumSamples={scenario.vacuumSamples}
          solveResult={scenario.solveResult}
          isProjectile
          g={scenario.env.g}
          mass={scenario.env.mass}
          planet={planet}
          dragEnabled={scenario.dragEnabled}
          impactEnabled={impact.enabled}
          rho={resolveAtmosphere(dragSettings.atmospherePreset, dragSettings.customRho, dragSettings.enabled).rho}
          cd={dragSettings.cd}
          area={dragSettings.area}
        />
      }
    />
  );
}
