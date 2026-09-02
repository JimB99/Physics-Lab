import type { CelestialBodyId } from '../types';

/** Planets modeled in the heliocentric solar-system view. */
export type OrbitalPlanetId = Exclude<CelestialBodyId, 'moon' | 'custom'>;

export type DisplayScaleMode = 'true' | 'schematic' | 'log';

export type AlignmentMetric =
  | 'pairwiseSum'
  | 'maxPairwise'
  | 'chainByLongitude'
  | 'collinear'
  | 'syzygy';

export type AlignmentSearchKind = 'cluster' | 'pair';

export interface PlanetPosition {
  id: OrbitalPlanetId;
  name: string;
  color: string;
  xAu: number;
  yAu: number;
  zAu: number;
  distanceAu: number;
  longitudeDeg: number;
  latitudeDeg: number;
  displayX: number;
  displayY: number;
  orbitDisplayRadius: number;
  markerSize: number;
}

export interface SolarSystemSnapshot {
  date: Date;
  positions: PlanetPosition[];
}

export interface AlignmentSearchResult {
  date: Date;
  score: number;
  metric: AlignmentMetric;
  positions: PlanetPosition[];
}

export interface PairConjunctionResult {
  bodyA: OrbitalPlanetId;
  bodyB: OrbitalPlanetId;
  date: Date;
  distanceAu: number;
  positions: PlanetPosition[];
}

export interface DateParts {
  day: number;
  month: number;
  year: number;
}
