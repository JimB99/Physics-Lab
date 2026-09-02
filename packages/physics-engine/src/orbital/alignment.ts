import { ORBITAL_BODY_MAP, ORBITAL_PLANETS } from './bodies';
import { heliocentricEcliptic } from './ephemeris';
import {
  bestFitLine2d,
  collinearRmsAu,
  syzygyAxisDeg,
  syzygyRmsDeg,
} from './geometry';
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

interface EclipticPoint {
  xAu: number;
  yAu: number;
  zAu: number;
  longitudeDeg: number;
}

export type AlignmentGuide =
  | { kind: 'line'; originX: number; originY: number; directionX: number; directionY: number }
  | { kind: 'axis'; longitudeDeg: number };

function angularSeparationDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function planetPoints(date: Date): EclipticPoint[] {
  return ORBITAL_PLANETS.map((p) => {
    const state = heliocentricEcliptic(p.body, date);
    return {
      xAu: state.xAu,
      yAu: state.yAu,
      zAu: state.zAu,
      longitudeDeg: state.longitudeDeg,
    };
  });
}

function separation(a: EclipticPoint, b: EclipticPoint): number {
  return Math.hypot(a.xAu - b.xAu, a.yAu - b.yAu, a.zAu - b.zAu);
}

export function pairDistanceAu(bodyA: OrbitalPlanetId, bodyB: OrbitalPlanetId, date: Date): number {
  const a = heliocentricEcliptic(ORBITAL_BODY_MAP[bodyA].body, date);
  const b = heliocentricEcliptic(ORBITAL_BODY_MAP[bodyB].body, date);
  return Math.hypot(a.xAu - b.xAu, a.yAu - b.yAu, a.zAu - b.zAu);
}

function sumOfPairs<T>(items: T[], distance: (a: T, b: T) => number): number {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      sum += distance(items[i]!, items[j]!);
    }
  }
  return sum;
}

function maxOfPairs<T>(items: T[], distance: (a: T, b: T) => number): number {
  let max = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const d = distance(items[i]!, items[j]!);
      if (d > max) max = d;
    }
  }
  return max;
}

function chainScore<T extends { longitudeDeg: number }>(
  items: T[],
  distance: (a: T, b: T) => number,
): number {
  if (items.length < 2) return 0;
  const sorted = [...items].sort((a, b) => a.longitudeDeg - b.longitudeDeg);
  let total = 0;
  let largest = 0;
  for (let i = 0; i < sorted.length; i++) {
    const link = distance(sorted[i]!, sorted[(i + 1) % sorted.length]!);
    total += link;
    if (link > largest) largest = link;
  }
  return total - largest;
}

function scorePoints(points: EclipticPoint[], metric: AlignmentMetric, space: 'au' | 'deg'): number {
  switch (metric) {
    case 'pairwiseSum':
      return space === 'au'
        ? sumOfPairs(points, separation)
        : sumOfPairs(points, (a, b) => angularSeparationDeg(a.longitudeDeg, b.longitudeDeg));
    case 'maxPairwise':
      return space === 'au'
        ? maxOfPairs(points, separation)
        : maxOfPairs(points, (a, b) => angularSeparationDeg(a.longitudeDeg, b.longitudeDeg));
    case 'chainByLongitude':
      return space === 'au'
        ? chainScore(points, separation)
        : chainScore(points, (a, b) => angularSeparationDeg(a.longitudeDeg, b.longitudeDeg));
    case 'collinear':
      return collinearRmsAu(points);
    case 'syzygy':
      return syzygyRmsDeg(points.map((p) => p.longitudeDeg));
  }
}

export function clusterScoreAu(date: Date, metric: AlignmentMetric): number {
  return scorePoints(planetPoints(date), metric, 'au');
}

export function clusterScore(date: Date, metric: AlignmentMetric): number {
  return scorePoints(planetPoints(date), metric, 'deg');
}

function scorePositions(positions: PlanetPosition[], metric: AlignmentMetric): number {
  const points: EclipticPoint[] = positions
    .filter((p) => p.id !== 'sun')
    .map((p) => ({ xAu: p.xAu, yAu: p.yAu, zAu: p.zAu, longitudeDeg: p.longitudeDeg }));
  return scorePoints(points, metric, 'au');
}

export function findBestAlignment(
  start: Date,
  endExclusive: Date,
  metric: AlignmentMetric,
  scaleMode: DisplayScaleMode = 'true',
): AlignmentSearchResult | null {
  const minimized = minimizeOnInterval(start, endExclusive, (date) => clusterScoreAu(date, metric));
  if (!minimized) return null;

  const positions = getSolarSystemSnapshot(minimized.date, scaleMode).positions;

  return {
    date: minimized.date,
    score: scorePositions(positions, metric),
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
    case 'collinear':
      return 'RMS distance to the best-fit ecliptic line (AU) — planets in a straight line';
    case 'syzygy':
      return 'RMS angle to the best-fit Sun axis (°) — planets on a line through the Sun';
  }
}

export function metricUnit(metric: AlignmentMetric): 'AU' | '°' {
  return metric === 'syzygy' ? '°' : 'AU';
}

export function alignmentGuide(
  positions: PlanetPosition[],
  metric: AlignmentMetric,
): AlignmentGuide | null {
  const planets = positions.filter((p) => p.id !== 'sun');
  if (planets.length < 2) return null;

  if (metric === 'collinear') {
    const line = bestFitLine2d(planets.map((p) => ({ xAu: p.displayX, yAu: p.displayY })));
    if (!line) return null;
    return {
      kind: 'line',
      originX: line.originX,
      originY: line.originY,
      directionX: line.directionX,
      directionY: line.directionY,
    };
  }

  if (metric === 'syzygy') {
    return { kind: 'axis', longitudeDeg: syzygyAxisDeg(planets.map((p) => p.longitudeDeg)) };
  }

  return null;
}
