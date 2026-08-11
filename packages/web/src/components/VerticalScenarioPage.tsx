import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CelestialBodyId, ImpactModel } from 'physics-engine';
import { WorkspaceLayout } from './layout/WorkspaceLayout';
import { EnvironmentPanel } from './inputs/EnvironmentPanel';
import { DragPanel, type DragSettings } from './inputs/DragPanel';
import { ImpactPanel } from './inputs/ImpactPanel';
import { SolvableField } from './inputs/SolvableField';
import { ResultsPanel } from './results/ResultsPanel';
import { SimulationCanvas } from './simulation/SimulationCanvas';
import { WorkspaceTabs } from './WorkspaceTabs';
import { useScenarioParams } from '../hooks/useScenarioParams';
import { useMotionScenario } from '../hooks/useMotionScenario';
import { DEFAULT_DRAG } from '../lib/scenarioDefaults';

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
  const [searchParams, setSearchParams] = useSearchParams();

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

  const dragSettings: DragSettings = useMemo(
    () => ({
      enabled: searchParams.get('drag') === '1',
      atmospherePreset: (searchParams.get('atmosphere') as DragSettings['atmospherePreset']) || DEFAULT_DRAG.atmospherePreset,
      customRho: parseFloat(searchParams.get('rho') || String(DEFAULT_DRAG.customRho)),
      shape: (searchParams.get('shape') as DragSettings['shape']) || DEFAULT_DRAG.shape,
      cd: parseFloat(searchParams.get('cd') || String(DEFAULT_DRAG.cd)),
      area: parseFloat(searchParams.get('area') || String(DEFAULT_DRAG.area)),
    }),
    [searchParams],
  );

  const setDragSettings = (s: DragSettings) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('drag', s.enabled ? '1' : '0');
        next.set('atmosphere', s.atmospherePreset);
        next.set('rho', String(s.customRho));
        next.set('shape', s.shape);
        next.set('cd', String(s.cd));
        next.set('area', String(s.area));
        return next;
      },
      { replace: true },
    );
  };

  const impactEnabled = searchParams.get('impact') === '1';
  const impactModel = (searchParams.get('impactModel') as ImpactModel) || 'stoppingTime';
  const stoppingTime = parseFloat(searchParams.get('stoppingTime') || '0.01');
  const stoppingDistance = parseFloat(searchParams.get('stoppingDistance') || '0.05');
  const contactArea = parseFloat(searchParams.get('contactArea') || '0');

  const setImpactParam = (key: string, val: string | number | boolean) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, String(val));
        return next;
      },
      { replace: true },
    );
  };

  const modes = useMemo(() => {
    const m = { ...DEFAULT_MODES };
    for (const key of Object.keys(urlModes)) {
      if (key in m && urlModes[key]) m[key] = urlModes[key]!;
    }
    return m;
  }, [urlModes]);

  const planet = (values.planet as CelestialBodyId) ?? 'earth';
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

  if (scenario.dragEnabled && scenario.energyLost !== undefined) {
    resultItems.push({ label: 'Energy lost to drag', value: scenario.energyLost, unit: 'J', multi: undefined });
  }

  const impactSpeed = scenario.summary ? Math.abs(scenario.summary.impactVelocity) : undefined;

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
          <DragPanel settings={dragSettings} mass={mass} g={scenario.env.g} onChange={setDragSettings} />
          <ImpactPanel
            enabled={impactEnabled}
            model={impactModel}
            stoppingTime={stoppingTime}
            stoppingDistance={stoppingDistance}
            contactArea={contactArea}
            impactSpeed={impactSpeed}
            mass={mass}
            onEnabledChange={(v) => setImpactParam('impact', v ? '1' : '0')}
            onModelChange={(m) => setImpactParam('impactModel', m)}
            onStoppingTimeChange={(v) => setImpactParam('stoppingTime', v)}
            onStoppingDistanceChange={(v) => setImpactParam('stoppingDistance', v)}
            onContactAreaChange={(v) => setImpactParam('contactArea', v)}
          />
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Problem fields</h3>
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
          flightTime={scenario.summary?.flightTime}
        />
      }
      results={<ResultsPanel items={resultItems} error={error} hint={`g = ${scenario.env.g} m/s²`} />}
      tabs={
        <WorkspaceTabs
          samples={scenario.samples}
          vacuumSamples={scenario.vacuumSamples}
          solveResult={scenario.solveResult}
          g={scenario.env.g}
          mass={scenario.env.mass}
          planet={planet}
          dragEnabled={scenario.dragEnabled}
          impactEnabled={impactEnabled}
        />
      }
    />
  );
}
