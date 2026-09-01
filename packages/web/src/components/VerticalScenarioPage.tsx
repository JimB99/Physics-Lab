import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CelestialBodyId } from 'physics-engine';
import { resolveAtmosphere } from 'physics-engine';
import { WorkspaceLayout } from './layout/WorkspaceLayout';
import { EnvironmentPanel } from './inputs/EnvironmentPanel';
import { DragPanel } from './inputs/DragPanel';
import { ImpactPanel } from './inputs/ImpactPanel';
import { SolvableField } from './inputs/SolvableField';
import { ResultsPanel } from './results/ResultsPanel';
import { ResultsActions } from './results/ResultsActions';
import { PresetBar } from './inputs/PresetBar';
import { VERTICAL_PRESETS } from '../lib/scenarioPresets';
import { SimulationCanvas } from './simulation/SimulationCanvas';
import { WorkspaceTabs } from './WorkspaceTabs';
import { useScenarioParams } from '../hooks/useScenarioParams';
import { useMotionScenario } from '../hooks/useMotionScenario';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDragSettings } from '../hooks/useDragSettings';
import { useImpactSettings } from '../hooks/useImpactSettings';

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
  variant: 'freeFall' | 'verticalThrow';
}

export function VerticalScenarioPage({ title, description, variant }: VerticalScenarioPageProps) {
  useDocumentTitle(title);
  const releasedFromRest = variant === 'freeFall';
  const [dragSettings, setDragSettings] = useDragSettings();
  const [impact, setImpact] = useImpactSettings();

  const fullDefaults = useMemo(() => {
    const numeric = Object.fromEntries(VERTICAL_FIELDS.map((f) => [f, FIELD_LABELS[f]!.default]));
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

  const effectiveModes = useMemo(
    () => (releasedFromRest ? { ...modes, v0: 'given' as const } : modes),
    [modes, releasedFromRest],
  );

  const effectiveValues = useMemo(
    () => (releasedFromRest ? { ...values, v0: 0 } : values),
    [values, releasedFromRest],
  );

  const planet = (values.planet as CelestialBodyId) ?? 'earth';
  const rawCustomG = Number(values.customG);
  const rawMass = Number(values.mass);
  const customG = Number.isFinite(rawCustomG) ? rawCustomG : 9.80665;
  const mass = Number.isFinite(rawMass) ? rawMass : 1;

  const scenario = useMotionScenario({
    kind: 'vertical1d',
    values: effectiveValues as unknown as Record<string, number>,
    modes: effectiveModes,
    planet,
    customG,
    mass,
    fieldIds: [...VERTICAL_FIELDS],
    dragSettings,
  });

  const [highlightTime, setHighlightTime] = useState<number | undefined>();

  const solved = scenario.solveResult.status === 'solved' ? scenario.solveResult.values : {};
  const multi = scenario.solveResult.status === 'solved' ? scenario.solveResult.multiValues : undefined;

  const error = scenario.dragEnabled
    ? undefined
    : scenario.solveResult.status === 'underdetermined'
      ? scenario.solveResult.message + (scenario.solveResult.missing.length ? `: ${scenario.solveResult.missing.join(', ')}` : '')
      : scenario.solveResult.status === 'overconstrained'
        ? `${scenario.solveResult.message} (${scenario.solveResult.conflicts.join('; ')})`
        : scenario.solveResult.status === 'noSolution'
          ? scenario.solveResult.message
          : undefined;

  const resultItems = VERTICAL_FIELDS.filter((f) => effectiveModes[f] === 'solve').map((f) => ({
    label: FIELD_LABELS[f]!.label,
    value: solved[f],
    unit: FIELD_LABELS[f]!.unit,
    multi: f === 't' ? multi?.t : f === 'v' ? multi?.v : undefined,
  }));

  if (scenario.dragEnabled && scenario.energyLost !== undefined) {
    resultItems.push({ label: 'Energy lost to drag', value: scenario.energyLost, unit: 'J', multi: undefined });
  }

  const impactSpeed = scenario.summary?.impactSpeed;

  return (
    <WorkspaceLayout
      title={title}
      inputs={
        <div>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{description}</p>
          <PresetBar presets={VERTICAL_PRESETS} />
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
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Lock values you know; mark others as Solve.
          </p>
          {releasedFromRest && (
            <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Free fall means released from rest, so v₀ is fixed at 0 m/s. Use{' '}
              <Link to="/motion/vertical-throw">Vertical Throw</Link> for a non-zero initial velocity.
            </p>
          )}
          {VERTICAL_FIELDS.filter((f) => !(releasedFromRest && f === 'v0')).map((f) => (
            <SolvableField
              key={f}
              id={f}
              label={FIELD_LABELS[f]!.label}
              unit={FIELD_LABELS[f]!.unit}
              mode={effectiveModes[f] ?? 'solve'}
              value={(effectiveValues[f] as number) ?? FIELD_LABELS[f]!.default}
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
          flightTime={scenario.summary?.flightTime}
        />
      }
      results={
        <ResultsPanel
          items={resultItems}
          error={error}
          hint={`g = ${scenario.env.g} m/s²`}
          actions={<ResultsActions samples={scenario.samples} csvBasename={`physics-lab-${variant}`} />}
        />
      }
      tabs={
        <WorkspaceTabs
          samples={scenario.samples}
          vacuumSamples={scenario.vacuumSamples}
          solveResult={scenario.solveResult}
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
