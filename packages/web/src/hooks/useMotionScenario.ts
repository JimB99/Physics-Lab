import { useMemo } from 'react';
import {
  resolveGravity,
  resolveAtmosphere,
  solveVertical1D,
  solveProjectile,
  sampleVertical1DTrajectory,
  sampleProjectileTrajectory,
  computeVertical1DSummary,
  computeProjectileSummary,
  integrateVertical1D,
  integrateProjectile2D,
  computeTrajectoryPair,
  type Environment,
  type MotionSample,
  type CelestialBodyId,
  type ScenarioSummary,
  type SolveStatus,
  type Vertical1DFieldId,
  type ProjectileFieldId,
  type FieldSpec,
  type DragConfig,
} from 'physics-engine';
import type { FieldMode } from '../components/inputs/SolvableField';
import type { DragSettings } from '../components/inputs/DragPanel';

type ScenarioKind = 'vertical1d' | 'projectile';

interface UseMotionScenarioOptions {
  kind: ScenarioKind;
  values: Record<string, number>;
  modes: Record<string, FieldMode>;
  planet: CelestialBodyId;
  customG: number;
  mass: number;
  fieldIds: string[];
  dragSettings: DragSettings;
}

export interface MotionScenarioResult {
  env: Environment;
  solveResult: SolveStatus;
  summary: ScenarioSummary | null;
  samples: MotionSample[];
  vacuumSamples: MotionSample[];
  h0: number;
  v0: number;
  angleDeg?: number;
  dragEnabled: boolean;
  energyLost?: number;
}

function buildFieldSpecs(
  fieldIds: string[],
  values: Record<string, number>,
  modes: Record<string, FieldMode>,
): FieldSpec[] {
  return fieldIds.map((id) => ({
    id,
    mode: modes[id] ?? 'solve',
    value: modes[id] === 'given' || modes[id] === undefined ? values[id] : undefined,
  }));
}

function buildDragConfig(env: Environment, drag: DragSettings): DragConfig {
  const atmosphere = resolveAtmosphere(drag.atmospherePreset, drag.customRho, drag.enabled);
  return {
    mass: env.mass,
    g: env.g,
    rho: atmosphere.rho,
    cd: drag.cd,
    area: drag.area,
  };
}

export function useMotionScenario(options: UseMotionScenarioOptions): MotionScenarioResult {
  const { kind, values, modes, planet, customG, mass, fieldIds, dragSettings } = options;

  return useMemo(() => {
    const g = resolveGravity(planet, customG);
    const env: Environment = { planet, g, mass };
    const dragConfig = buildDragConfig(env, dragSettings);
    const dragEnabled = dragSettings.enabled && dragConfig.rho > 0;
    const atmosphere = resolveAtmosphere(dragSettings.atmospherePreset, dragSettings.customRho, dragSettings.enabled);

    if (dragEnabled) {
      const h0 = values.h0 ?? 10;
      const v0 = values.v0 ?? 0;
      const angleDeg = values.angle ?? 45;

      if (kind === 'vertical1d') {
        const samples = integrateVertical1D(h0, v0, env, dragConfig, { step: 0.05 });
        const vacuumSamples = sampleVertical1DTrajectory(h0, v0, env, { step: 0.05 });
        const summary = computeVertical1DSummary({ h0, v0 }, env);
        const pair = computeTrajectoryPair('vertical1d', { h0, v0 }, env, atmosphere, dragConfig);
        return {
          env,
          solveResult: { status: 'noSolution' as const, message: 'Flexible solve disabled with air resistance' },
          summary,
          samples,
          vacuumSamples,
          h0,
          v0,
          dragEnabled: true,
          energyLost: pair.energyLost,
        };
      }

      const samples = integrateProjectile2D(h0, v0, angleDeg, env, dragConfig, { step: 0.05 });
      const vacuumSamples = sampleProjectileTrajectory(h0, v0, angleDeg, env, { step: 0.05 });
      const summary = computeProjectileSummary({ h0, v0, angleDeg }, env);
      const pair = computeTrajectoryPair('projectile', { h0, v0, angleDeg }, env, atmosphere, dragConfig);
      return {
        env,
        solveResult: { status: 'noSolution' as const, message: 'Flexible solve disabled with air resistance' },
        summary,
        samples,
        vacuumSamples,
        h0,
        v0,
        angleDeg,
        dragEnabled: true,
        energyLost: pair.energyLost,
      };
    }

    const specs = buildFieldSpecs(fieldIds, values, modes);

    if (kind === 'vertical1d') {
      const solveResult = solveVertical1D(specs as FieldSpec<Vertical1DFieldId>[], env);
      let h0 = values.h0 ?? 0;
      let v0 = values.v0 ?? 0;

      if (solveResult.status === 'solved') {
        h0 = modes.h0 === 'given' ? values.h0 : (solveResult.values.h0 ?? h0);
        v0 = modes.v0 === 'given' ? values.v0 : (solveResult.values.v0 ?? v0);
      }

      const summary = solveResult.status === 'solved' ? computeVertical1DSummary({ h0, v0 }, env) : null;
      const samples = solveResult.status === 'solved' ? sampleVertical1DTrajectory(h0, v0, env, { step: 0.05 }) : [];

      return { env, solveResult, summary, samples, vacuumSamples: samples, h0, v0, dragEnabled: false };
    }

    const solveResult = solveProjectile(specs as FieldSpec<ProjectileFieldId>[], env);
    let h0 = values.h0 ?? 0;
    let v0 = values.v0 ?? 0;
    let angleDeg = values.angle ?? 45;

    if (solveResult.status === 'solved') {
      h0 = modes.h0 === 'given' ? values.h0 : (solveResult.values.h0 ?? h0);
      v0 = modes.v0 === 'given' ? values.v0 : (solveResult.values.v0 ?? v0);
      angleDeg = modes.angle === 'given' ? values.angle : (solveResult.values.angle ?? angleDeg);
    }

    const summary = solveResult.status === 'solved' ? computeProjectileSummary({ h0, v0, angleDeg }, env) : null;
    const samples = solveResult.status === 'solved' ? sampleProjectileTrajectory(h0, v0, angleDeg, env, { step: 0.05 }) : [];

    return { env, solveResult, summary, samples, vacuumSamples: samples, h0, v0, angleDeg, dragEnabled: false };
  }, [kind, values, modes, planet, customG, mass, fieldIds, dragSettings]);
}
