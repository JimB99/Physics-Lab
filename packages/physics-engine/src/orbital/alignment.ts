import { EclipticLongitude } from 'astronomy-engine';
import { ORBITAL_BODY_MAP, ORBITAL_PLANETS } from './bodies';
import { heliocentricEcliptic } from './ephemeris';
import { getSolarSystemSnapshot } from './positions';
import { minimizeOnInterval } from './search';
import type {
  AlignmentMetric,
  AlignmentSearchResult,
  DisplayScaleMode,
  OrbitalPlanetId,
  PairConjunctionResult,
  PlanetPosition,
} from './types';

function angularSeparationDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function planetLongitudes(date: Date): number[] {
  return ORBITAL_PLANETS.map((p) => EclipticLongitude(p.body, date));
}

function distanceAu(a: PlanetPosition, b: PlanetPosition): number {
  return Math.hypot(a.xAu - b.xAu, a.yAu - b.yAu, a.zAu - b.zAu);
}

export function pairDistanceAu(bodyA: OrbitalPlanetId, bodyB: OrbitalPlanetId, date: Date): number {
  const a = heliocentricEcliptic(ORBITAL_BODY_MAP[bodyA].body, date);
  const b = heliocentricEcliptic(ORBITAL_BODY_MAP[bodyB].body, date);
  return Math.hypot(a.xAu - b.xAu, a.yAu - b.yAu, a.zAu - b.zAu);
}

function planetsOnly(positions: PlanetPosition[]): PlanetPosition[] {
  return positions.filter((p) => p.id !== 'sun');
}

function scorePairwiseSum3D(positions: PlanetPosition[]): number {
  const planets = planetsOnly(positions);
  let sum = 0;
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      sum += distanceAu(planets[i]!, planets[j]!);
    }
  }
  return sum;
}

function scoreMaxPairwise3D(positions: PlanetPosition[]): number {
  const planets = planetsOnly(positions);
  let max = 0;
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      max = Math.max(max, distanceAu(planets[i]!, planets[j]!));
    }
  }
  return max;
}

function scoreChainByLongitude3D(positions: PlanetPosition[]): number {
  const planets = [...planetsOnly(positions)].sort((a, b) => a.longitudeDeg - b.longitudeDeg);
  let sum = 0;
  for (let i = 0; i < planets.length - 1; i++) {
    sum += distanceAu(planets[i]!, planets[i + 1]!);
  }
  return sum;
}

function scorePositions3D(positions: PlanetPosition[], metric: AlignmentMetric): number {
  switch (metric) {
    case 'pairwiseSum':
      return scorePairwiseSum3D(positions);
    case 'maxPairwise':
      return scoreMaxPairwise3D(positions);
    case 'chainByLongitude':
      return scoreChainByLongitude3D(positions);
  }
}

/** Lightweight search-phase score using ecliptic longitudes only. */
export function clusterScore(date: Date, metric: AlignmentMetric): number {
  const longitudes = planetLongitudes(date);

  switch (metric) {
    case 'pairwiseSum': {
      let sum = 0;
      for (let i = 0; i < longitudes.length; i++) {
        for (let j = i + 1; j < longitudes.length; j++) {
          sum += angularSeparationDeg(longitudes[i]!, longitudes[j]!);
        }
      }
      return sum;
    }
    case 'maxPairwise': {
      let max = 0;
      for (let i = 0; i < longitudes.length; i++) {
        for (let j = i + 1; j < longitudes.length; j++) {
          max = Math.max(max, angularSeparationDeg(longitudes[i]!, longitudes[j]!));
        }
      }
      return max;
    }
    case 'chainByLongitude': {
      const sorted = [...longitudes].sort((a, b) => a - b);
      let sum = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        sum += angularSeparationDeg(sorted[i]!, sorted[i + 1]!);
      }
      return sum;
    }
  }
}

export function findBestAlignment(
  start: Date,
  endExclusive: Date,
  metric: AlignmentMetric,
  scaleMode: DisplayScaleMode = 'true',
): AlignmentSearchResult | null {
  const minimized = minimizeOnInterval(start, endExclusive, (date) => clusterScore(date, metric));
  if (!minimized) return null;

  const positions = getSolarSystemSnapshot(minimized.date, scaleMode).positions;
  const score = scorePositions3D(positions, metric);

  return {
    date: minimized.date,
    score,
    metric,
    positions,
  };
}

export function findClosestPair(
  bodyA: OrbitalPlanetId,
  bodyB: OrbitalPlanetId,
  start: Date,
  endExclusive: Date,
  scaleMode: DisplayScaleMode = 'true',
): PairConjunctionResult | null {
  if (bodyA === bodyB) throw new Error('Choose two different bodies');

  const minimized = minimizeOnInterval(start, endExclusive, (date) =>
    pairDistanceAu(bodyA, bodyB, date),
  );
  if (!minimized) return null;

  return {
    bodyA,
    bodyB,
    date: minimized.date,
    distanceAu: minimized.score,
    positions: getSolarSystemSnapshot(minimized.date, scaleMode).positions,
  };
}

export function metricLabel(metric: AlignmentMetric): string {
  switch (metric) {
    case 'pairwiseSum':
      return 'Sum of all planet-pair distances (AU) — minimized when planets cluster';
    case 'maxPairwise':
      return 'Maximum planet-pair distance (AU) — minimized when the spread is smallest';
    case 'chainByLongitude':
      return 'Chain distance along ecliptic longitude order (AU) — diagram alignment proxy';
  }
}
