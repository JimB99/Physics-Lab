import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  computeComparisonTrajectories,
  parseIsoDate,
  formatIsoDate,
  resolveGravity,
  resolveAtmosphere,
  todayUtcDate,
  type ComparisonVariant,
} from 'physics-engine';
import { CompareConfigurator } from '../components/compare/CompareConfigurator';
import { CompareGraphs } from '../components/compare/CompareGraphs';
import { CompareOrbitPanel } from '../components/compare/CompareOrbitPanel';
import { CompareSimulation } from '../components/compare/CompareSimulation';
import { CompareSummaryTable } from '../components/compare/CompareSummaryTable';
import {
  nextVariantId,
  planetLabel,
  variantColor,
  type CompareScenario,
  type CompareType,
  type VariantConfig,
} from '../lib/compareDefaults';
import { DEFAULT_DRAG } from '../lib/scenarioDefaults';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useCompareParams } from '../hooks/useCompareParams';

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

    const label =
      compareType === 'environment'
        ? planetLabel(c.planet)
        : compareType === 'drag'
          ? `${c.id.toUpperCase()} · ${dragEnabled ? 'with drag' : 'vacuum'}`
          : `${c.angle}°`;

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
  useDocumentTitle('Comparison Mode');
  const [searchParams, setSearchParams] = useSearchParams();
  const [{ scenario, compareType, variants }, setCompareParams] = useCompareParams();

  const orbitDate = useMemo(() => {
    const param = searchParams.get('orbitDate');
    if (!param) return todayUtcDate();
    return parseIsoDate(param) ?? todayUtcDate();
  }, [searchParams]);

  const setOrbitDate = useCallback(
    (date: Date) => {
      const value = formatIsoDate(date);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('orbitDate', value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const comparisonVariants = useMemo(
    () => buildVariants(variants, scenario, compareType),
    [variants, scenario, compareType],
  );

  const series = useMemo(
    () => computeComparisonTrajectories(scenario, comparisonVariants, { step: 0.05 }),
    [scenario, comparisonVariants],
  );

  const updateVariant = (id: string, partial: Partial<VariantConfig>) => {
    setCompareParams({
      variants: variants.map((v) => (v.id === id ? { ...v, ...partial } : v)),
    });
  };

  const addVariant = () => {
    if (variants.length >= 3) return;
    const id = nextVariantId(variants);
    setCompareParams({
      variants: [
        ...variants,
        {
          id,
          label: `Variant ${id.toUpperCase()}`,
          color: variantColor(variants.length),
          planet: 'mars',
          customG: 3.71,
          h0: variants[0]?.h0 ?? 10,
          v0: variants[0]?.v0 ?? 0,
          angle: compareType === 'angle' ? 60 : (variants[0]?.angle ?? 45),
          dragEnabled: compareType === 'drag',
        },
      ],
    });
  };

  const removeVariant = (id: string) => {
    setCompareParams({ variants: variants.filter((v) => v.id !== id) });
  };

  return (
    <div className="compare-page">
      <h1 className="workspace__title">Comparison Mode</h1>
      <p className="compare-hint muted">
        Compare up to three variants. The full setup lives in the URL, so you can share a link.
      </p>

      <div className="compare-layout">
        <div className="card">
          <CompareConfigurator
            scenario={scenario}
            compareType={compareType}
            variants={variants}
            onScenarioChange={(next) =>
              setCompareParams({
                scenario: next,
                compareType: next === 'vertical1d' && compareType === 'angle' ? 'environment' : compareType,
              })
            }
            onCompareTypeChange={(next) => setCompareParams({ compareType: next })}
            onVariantChange={updateVariant}
            onAddVariant={addVariant}
            onRemoveVariant={removeVariant}
          />
        </div>

        <div>
          <div className="card">
            <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Simulation</h2>
            <CompareSimulation series={series} isProjectile={scenario === 'projectile'} />
          </div>
          <div className="card" style={{ marginTop: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Summary</h2>
            <CompareSummaryTable series={series} isProjectile={scenario === 'projectile'} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Graphs</h2>
        <CompareGraphs series={series} isProjectile={scenario === 'projectile'} />
      </div>

      <CompareOrbitPanel
        orbitDate={orbitDate}
        onDateChange={setOrbitDate}
        planets={variants.map((v) => v.planet)}
      />
    </div>
  );
}
