import { G0 } from '../constants';
import { impactPressure } from './pressure';
import type { ImpactInputs, ImpactOutput, ImpactResult } from './types';

const ASSUMPTIONS = [
  'Rigid-body stopping model with uniform deceleration assumed',
  'Average force over stopping interval — not peak force',
  'No material deformation or crumple-zone physics',
];

function validate(inputs: ImpactInputs): string[] {
  const errors: string[] = [];
  if (inputs.mass <= 0) errors.push('Mass must be positive');
  if (inputs.impactSpeed <= 0) errors.push('Impact speed must be positive');
  if (inputs.model === 'stoppingTime') {
    if (!inputs.stoppingTime || inputs.stoppingTime <= 0) errors.push('Stopping time must be positive');
  } else if (inputs.model === 'stoppingDistance') {
    if (!inputs.stoppingDistance || inputs.stoppingDistance <= 0) errors.push('Stopping distance must be positive');
  }
  if (inputs.contactArea !== undefined && inputs.contactArea <= 0) {
    errors.push('Contact area must be positive');
  }
  return errors;
}

export function computeImpact(inputs: ImpactInputs): ImpactOutput {
  const errors = validate(inputs);
  if (errors.length > 0) return { valid: false, errors };

  const momentumChange = inputs.mass * inputs.impactSpeed;
  let averageForce: number;

  if (inputs.model === 'stoppingTime') {
    averageForce = momentumChange / inputs.stoppingTime!;
  } else {
    averageForce = (inputs.mass * inputs.impactSpeed * inputs.impactSpeed) / (2 * inputs.stoppingDistance!);
  }

  const impactAcceleration = averageForce / inputs.mass;
  const impactGForce = impactAcceleration / G0;

  const result: ImpactResult = {
    momentumChange,
    averageForce,
    impactAcceleration,
    impactGForce,
    modelUsed: inputs.model,
    assumptions: ASSUMPTIONS,
  };

  if (inputs.contactArea !== undefined) {
    result.pressure = impactPressure(averageForce, inputs.contactArea);
  }

  return result;
}
