export type PlanetId = 'earth' | 'moon' | 'mars' | 'custom';

export interface Environment {
  planet: PlanetId;
  g: number;
  mass: number;
}

export interface MotionSample {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  speed: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalMechanicalEnergy: number;
  gForce: number;
  gravitationalForce: number;
}

export interface ScenarioSummary {
  flightTime: number;
  maxHeight: number;
  impactVelocity: number;
  impactAngle?: number;
  horizontalDistance?: number;
  timeToMaxHeight?: number;
}

export interface SampleOptions {
  duration?: number;
  step?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface Vertical1DInputs {
  h0: number;
  v0: number;
}

export interface ProjectileInputs {
  h0: number;
  v0: number;
  angleDeg: number;
}
