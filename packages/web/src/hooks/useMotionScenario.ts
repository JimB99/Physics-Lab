import { useMemo } from 'react';
import {
  resolveGravity,
  solveVertical1D,
  solveProjectile,
  sampleVertical1DTrajectory,
  sampleProjectileTrajectory,
  computeVertical1DSummary,
  computeProjectileSummary,
  type Environment,
  type MotionSample,
  type PlanetId,
  type ScenarioSummary,
  type SolveStatus,
  type Vertical1DFieldId,
  type ProjectileFieldId,
  type FieldSpec,
} from 'physics-engine';
import type { FieldMode } from '../components/inputs/SolvableField';

type ScenarioKind = 'vertical1d' | 'projectile';

interface UseMotionScenarioOptions {
  kind: ScenarioKind;
  values: Record<string, number>;
  modes: Record<string, FieldMode>;
  planet: PlanetId;
  customG: number;
  mass: number;
  fieldIds: string[];
}

export interface MotionScenarioResult {
  env: Environment;
  solveResult: SolveStatus;
  summary: ScenarioSummary | null;
  samples: MotionSample[];
  h0: number;
  v0: number;
  angleDeg?: number;
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

export function useMotionScenario(options: UseMotionScenarioOptions): MotionScenarioResult {
  const { kind, values, modes, planet, customG, mass, fieldIds } = options;

  return useMemo(() => {
    const g = resolveGravity(planet, customG);
    const env: Environment = { planet, g, mass };
    const specs = buildFieldSpecs(fieldIds, values, modes);

    if (kind === 'vertical1d') {
      const solveResult = solveVertical1D(specs as FieldSpec<Vertical1DFieldId>[], env);
      let h0 = values.h0 ?? 0;
      let v0 = values.v0 ?? 0;

      if (solveResult.status === 'solved') {
        h0 = modes.h0 === 'given' ? values.h0 : (solveResult.values.h0 ?? h0);
        v0 = modes.v0 === 'given' ? values.v0 : (solveResult.values.v0 ?? v0);
      }

      const summary =
        solveResult.status === 'solved' ? computeVertical1DSummary({ h0, v0 }, env) : null;
      const samples =
        solveResult.status === 'solved'
          ? sampleVertical1DTrajectory(h0, v0, env, { step: 0.05 })
          : [];

      return { env, solveResult, summary, samples, h0, v0 };
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

    const summary =
      solveResult.status === 'solved'
        ? computeProjectileSummary({ h0, v0, angleDeg }, env)
        : null;
    const samples =
      solveResult.status === 'solved'
        ? sampleProjectileTrajectory(h0, v0, angleDeg, env, { step: 0.05 })
        : [];

    return { env, solveResult, summary, samples, h0, v0, angleDeg };
  }, [kind, values, modes, planet, customG, mass, fieldIds]);
}
