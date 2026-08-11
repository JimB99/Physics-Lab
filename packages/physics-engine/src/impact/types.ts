export type ImpactModel = 'stoppingTime' | 'stoppingDistance';

export interface ImpactInputs {
  mass: number;
  impactSpeed: number;
  model: ImpactModel;
  stoppingTime?: number;
  stoppingDistance?: number;
  contactArea?: number;
}

export interface ImpactResult {
  momentumChange: number;
  averageForce: number;
  impactAcceleration: number;
  impactGForce: number;
  pressure?: number;
  modelUsed: ImpactModel;
  assumptions: string[];
}

export interface ImpactValidationError {
  valid: false;
  errors: string[];
}

export type ImpactOutput = ImpactResult | ImpactValidationError;
