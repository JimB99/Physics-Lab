import { degToRad } from '../units';
import type { Environment, ProjectileInputs, ScenarioSummary, ValidationResult } from '../types';
import {
  firstImpactTime,
  maxHeight1D,
  positionProjectile,
  sampleProjectileTrajectory,
} from './kinematics';

export function validateProjectileInputs(inputs: ProjectileInputs): ValidationResult {
  const errors: string[] = [];
  if (inputs.h0 < 0) errors.push('Initial height must be non-negative');
  if (inputs.v0 < 0) errors.push('Initial speed must be non-negative');
  if (inputs.angleDeg < 0 || inputs.angleDeg > 90) {
    errors.push('Launch angle must be between 0° and 90°');
  }
  if (!Number.isFinite(inputs.h0) || !Number.isFinite(inputs.v0) || !Number.isFinite(inputs.angleDeg)) {
    errors.push('All inputs must be finite numbers');
  }
  return { valid: errors.length === 0, errors };
}

export function computeProjectileSummary(
  inputs: ProjectileInputs,
  env: Environment,
): ScenarioSummary | null {
  const angleRad = degToRad(inputs.angleDeg);
  const vy0 = inputs.v0 * Math.sin(angleRad);
  const impact = firstImpactTime(inputs.h0, vy0, env.g);
  if (impact === null) return null;
  const end = positionProjectile(inputs.h0, inputs.v0, angleRad, env.g, impact);
  const impactAngle = (Math.atan2(end.vy, end.vx) * 180) / Math.PI;
  const impactSpeed = Math.sqrt(end.vx * end.vx + end.vy * end.vy);
  const maxH = maxHeight1D(inputs.h0, vy0, env.g);
  const tMax = vy0 > 0 ? vy0 / env.g : null;
  return {
    flightTime: impact,
    maxHeight: maxH,
    impactVelocity: impactSpeed,
    impactAngle,
    horizontalDistance: end.x,
    timeToMaxHeight: tMax ?? undefined,
  };
}

export { sampleProjectileTrajectory, positionProjectile };
