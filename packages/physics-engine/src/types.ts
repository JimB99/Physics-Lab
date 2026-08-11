export type CelestialBodyId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'sun'
  | 'custom';

/** @deprecated Use CelestialBodyId */
export type PlanetId = CelestialBodyId;

export type CelestialBodyKind = 'planet' | 'moon' | 'star';

export interface CelestialBody {
  id: CelestialBodyId;
  name: string;
  kind: CelestialBodyKind;
  surfaceGravity: number;
  referenceNote: string;
}

export type AtmospherePresetId = 'earthSeaLevel' | 'marsThin' | 'moonVacuum' | 'custom';

export interface Atmosphere {
  enabled: boolean;
  rho: number;
  preset: AtmospherePresetId;
}

export type ShapePresetId = 'sphere' | 'cube' | 'cylinder' | 'flatPlate' | 'custom';

export interface Environment {
  planet: CelestialBodyId;
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
  dragForce?: number;
  netForce?: number;
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

export interface DragConfig {
  mass: number;
  g: number;
  rho: number;
  cd: number;
  area: number;
}
