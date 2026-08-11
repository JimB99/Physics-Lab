import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  computeComparisonTrajectories,
  resolveGravity,
  resolveAtmosphere,
  type ComparisonVariant,
} from 'physics-engine';
import { CompareConfigurator } from '../components/compare/CompareConfigurator';
import { CompareGraphs } from '../components/compare/CompareGraphs';
import { CompareSimulation } from '../components/compare/CompareSimulation';
import {
  COMPARE_COLORS,
  DEFAULT_VARIANTS,
  type CompareScenario,
  type CompareType,
  type VariantConfig,
} from '../lib/compareDefaults';
import { DEFAULT_DRAG } from '../lib/scenarioDefaults';

function buildVariants(
  configs: VariantConfig[],
  scenario: CompareScenario,
  compareType: CompareType,
): ComparisonVariant[] {
  return configs.map((c) => {
    const g = resolveGravity(c.planet, c.customG);
    const dragEnabled = compareType === 'drag' ? c.dragEnabled : false;
    const atmosphere = resolveAtmosphere(
      dragEnabled ? 'earthSeaLevel' : 'moonVacuum',
      DEFAULT_DRAG.customRho,
      dragEnabled,
    );
    const drag = {
      mass: 1,
      g,
      rho: atmosphere.rho,
      cd: DEFAULT_DRAG.cd,
      area: DEFAULT_DRAG.area,
    };
    const inputs =
      scenario === 'projectile'
        ? { h0: c.h0, v0: c.v0, angleDeg: c.angle }
        : { h0: c.h0, v0: c.v0 };

    let label = c.label;
    if (compareType === 'environment') label = c.planet.charAt(0).toUpperCase() + c.planet.slice(1);
    if (compareType === 'drag') label = dragEnabled ? 'With drag' : 'Vacuum';
    if (compareType === 'angle') label = `${c.angle}°`;

    return {
      id: c.id,
      label,
      color: c.color,
      env: { planet: c.planet, g, mass: 1 },
      atmosphere,
      drag,
      inputs,
    };
  });
}

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const [scenario, setScenario] = useState<CompareScenario>(
    (searchParams.get('scenario') as CompareScenario) || 'vertical1d',
  );
  const [compareType, setCompareType] = useState<CompareType>(
    (searchParams.get('type') as CompareType) || 'environment',
  );
  const [variants, setVariants] = useState<VariantConfig[]>(DEFAULT_VARIANTS);

  const comparisonVariants = useMemo(
    () => buildVariants(variants, scenario, compareType),
    [variants, scenario, compareType],
  );

  const series = useMemo(
    () => computeComparisonTrajectories(scenario, comparisonVariants, { step: 0.05 }),
    [scenario, comparisonVariants],
  );

  const updateVariant = (id: string, partial: Partial<VariantConfig>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...partial } : v)));
  };

  const addVariant = () => {
    if (variants.length >= 3) return;
    setVariants((prev) => [
      ...prev,
      {
        id: 'c',
        label: 'Variant C',
        color: COMPARE_COLORS[2]!,
        planet: 'mars',
        customG: 3.71,
        h0: 10,
        v0: 0,
        angle: 60,
        dragEnabled: true,
      },
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div style={{ padding: '1rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1>Comparison Mode</h1>
      <p className="muted">Compare up to three scenarios on the same graphs and simulation.</p>

      <div className="card" style={{ marginTop: '1rem' }}>
        <CompareConfigurator
          scenario={scenario}
          compareType={compareType}
          variants={variants}
          onScenarioChange={setScenario}
          onCompareTypeChange={setCompareType}
          onVariantChange={updateVariant}
          onAddVariant={addVariant}
          onRemoveVariant={removeVariant}
        />
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Simulation</h2>
        <CompareSimulation series={series} isProjectile={scenario === 'projectile'} />
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Graphs</h2>
        <CompareGraphs series={series} isProjectile={scenario === 'projectile'} />
      </div>
    </div>
  );
}
