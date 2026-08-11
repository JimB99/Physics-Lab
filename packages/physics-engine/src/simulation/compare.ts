import { sampleProjectileTrajectory, sampleVertical1DTrajectory } from '../motion/kinematics';
import { integrateProjectile2D, integrateVertical1D } from './integrator';
import type {
  Atmosphere,
  DragConfig,
  Environment,
  MotionSample,
  ProjectileInputs,
  Vertical1DInputs,
} from '../types';

export interface TrajectoryPair {
  vacuum: MotionSample[];
  withDrag: MotionSample[];
  energyLost: number;
}

function computeEnergyLost(samples: MotionSample[]): number {
  if (samples.length < 2) return 0;
  const E0 = samples[0]!.totalMechanicalEnergy;
  const E1 = samples[samples.length - 1]!.totalMechanicalEnergy;
  return Math.max(0, E0 - E1);
}

export function computeTrajectoryPair(
  scenario: 'vertical1d' | 'projectile',
  inputs: Vertical1DInputs | ProjectileInputs,
  env: Environment,
  atmosphere: Atmosphere,
  drag: DragConfig,
  step = 0.05,
): TrajectoryPair {
  const vacuum =
    scenario === 'vertical1d'
      ? sampleVertical1DTrajectory(inputs.h0, inputs.v0, env, { step })
      : sampleProjectileTrajectory(
          inputs.h0,
          (inputs as ProjectileInputs).v0,
          (inputs as ProjectileInputs).angleDeg,
          env,
          { step },
        );

  const noDrag = { ...drag, rho: 0 };
  const withDragSamples =
    scenario === 'vertical1d'
      ? integrateVertical1D(inputs.h0, inputs.v0, env, atmosphere.enabled ? drag : noDrag, { step })
      : integrateProjectile2D(
          inputs.h0,
          (inputs as ProjectileInputs).v0,
          (inputs as ProjectileInputs).angleDeg,
          env,
          atmosphere.enabled ? drag : noDrag,
          { step },
        );

  return {
    vacuum,
    withDrag: withDragSamples,
    energyLost: computeEnergyLost(withDragSamples),
  };
}

export interface ComparisonVariant {
  id: string;
  label: string;
  color: string;
  env: Environment;
  atmosphere: Atmosphere;
  drag: DragConfig;
  inputs: Vertical1DInputs | ProjectileInputs;
}

export interface ComparisonSeries {
  label: string;
  samples: MotionSample[];
  color: string;
}

export function computeComparisonTrajectories(
  scenario: 'vertical1d' | 'projectile',
  variants: ComparisonVariant[],
  options: { step: number },
): ComparisonSeries[] {
  return variants.map((variant) => {
    const useDrag = variant.atmosphere.enabled && variant.drag.rho > 0;
    const samples =
      useDrag
        ? scenario === 'vertical1d'
          ? integrateVertical1D(
              variant.inputs.h0,
              variant.inputs.v0,
              variant.env,
              variant.drag,
              { step: options.step },
            )
          : integrateProjectile2D(
              variant.inputs.h0,
              (variant.inputs as ProjectileInputs).v0,
              (variant.inputs as ProjectileInputs).angleDeg,
              variant.env,
              variant.drag,
              { step: options.step },
            )
        : scenario === 'vertical1d'
          ? sampleVertical1DTrajectory(variant.inputs.h0, variant.inputs.v0, variant.env, { step: options.step })
          : sampleProjectileTrajectory(
              variant.inputs.h0,
              (variant.inputs as ProjectileInputs).v0,
              (variant.inputs as ProjectileInputs).angleDeg,
              variant.env,
              { step: options.step },
            );

    return { label: variant.label, samples, color: variant.color };
  });
}
