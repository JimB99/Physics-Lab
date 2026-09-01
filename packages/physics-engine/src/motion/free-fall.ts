import type { Environment, ScenarioSummary, ValidationResult, Vertical1DInputs } from '../types';
import {
  firstImpactTime,
  maxHeight1D,
  position1D,
  sampleVertical1DTrajectory,
  timeToMaxHeight1D,
  velocity1D,
} from './kinematics';

export function validateVertical1DInputs(inputs: Vertical1DInputs): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(inputs.h0) || !Number.isFinite(inputs.v0)) {
    errors.push('Initial height and velocity must be finite numbers');
  } else if (inputs.h0 < 0) {
    errors.push('Initial height must be non-negative (the ground is at y = 0)');
  }
  return { valid: errors.length === 0, errors };
}

export function validateEnvironment(env: Environment): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(env.mass) || env.mass <= 0) {
    errors.push('Mass must be a positive number');
  }
  if (!Number.isFinite(env.g) || env.g <= 0) {
    errors.push('Gravitational acceleration must be a positive number');
  }
  return { valid: errors.length === 0, errors };
}

export function computeVertical1DSummary(
  inputs: Vertical1DInputs,
  env: Environment,
): ScenarioSummary | null {
  const impact = firstImpactTime(inputs.h0, inputs.v0, env.g);
  if (impact === null) return null;
  const impactVelocity = velocity1D(inputs.v0, env.g, impact);
  const maxH = maxHeight1D(inputs.h0, inputs.v0, env.g);
  const tMax = timeToMaxHeight1D(inputs.v0, env.g);
  return {
    flightTime: impact,
    maxHeight: maxH,
    impactSpeed: Math.abs(impactVelocity),
    impactVelocityY: impactVelocity,
    timeToMaxHeight: tMax ?? undefined,
  };
}

export function sampleFreeFallTrajectory(
  inputs: Vertical1DInputs,
  env: Environment,
  options?: { step?: number },
) {
  return sampleVertical1DTrajectory(inputs.h0, inputs.v0, env, options);
}

export { position1D, velocity1D };
