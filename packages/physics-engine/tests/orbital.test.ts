import { describe, expect, it } from 'vitest';
import { Body } from 'astronomy-engine';
import { clusterScore, findBestAlignment, findClosestPair, metricLabel, pairDistanceAu } from '../src/orbital/alignment';
import { ORBITAL_BODIES } from '../src/orbital/bodies';
import { addDays, enumerateDates, formatDateString, parseDateParts, validateDateParts } from '../src/orbital/dates';
import { heliocentricEcliptic } from '../src/orbital/ephemeris';
import { applyPlanetCalendarPreset } from '../src/orbital/presets';
import { getSolarSystemSnapshot } from '../src/orbital/positions';
import { minimizeOnInterval } from '../src/orbital/search';

describe('orbital dates', () => {
  it('validates impossible dates', () => {
    expect(validateDateParts(31, 2, 2024)).toBe('Invalid calendar date');
    expect(validateDateParts(15, 6, 2024)).toBeNull();
  });

  it('round-trips calendar dates', () => {
    const date = parseDateParts(1, 1, 2000);
    expect(formatDateString(date)).toBe('1.1.2000');
    expect(formatDateString(addDays(date, 365))).toBe('31.12.2000');
  });
});

describe('orbital ephemeris', () => {
  const j2000 = parseDateParts(1, 1, 2000);

  it('places the Sun at the origin', () => {
    const sun = heliocentricEcliptic(Body.Sun, j2000);
    expect(sun.distanceAu).toBe(0);
    expect(sun.xAu).toBe(0);
    expect(sun.yAu).toBe(0);
  });

  it('orders planets by heliocentric distance', () => {
    const mercury = heliocentricEcliptic(Body.Mercury, j2000).distanceAu;
    const earth = heliocentricEcliptic(Body.Earth, j2000).distanceAu;
    const neptune = heliocentricEcliptic(Body.Neptune, j2000).distanceAu;
    expect(mercury).toBeLessThan(earth);
    expect(earth).toBeLessThan(neptune);
  });

  it('returns finite positions for every modeled body', () => {
    for (const body of ORBITAL_BODIES) {
      const state = heliocentricEcliptic(body.body, j2000);
      expect(Number.isFinite(state.longitudeDeg)).toBe(true);
      expect(Number.isFinite(state.latitudeDeg)).toBe(true);
      expect(Number.isFinite(state.distanceAu)).toBe(true);
    }
  });
});

describe('solar system snapshot', () => {
  it('returns nine bodies including the Sun', () => {
    const snapshot = getSolarSystemSnapshot(parseDateParts(20, 8, 2026), 'true');
    expect(snapshot.positions).toHaveLength(9);
    expect(snapshot.positions.some((p) => p.id === 'sun')).toBe(true);
  });

  it('uses schematic radii only for display in schematic mode', () => {
    const snapshot = getSolarSystemSnapshot(parseDateParts(1, 1, 2000), 'schematic');
    const mars = snapshot.positions.find((p) => p.id === 'mars');
    expect(mars?.orbitDisplayRadius).toBe(8);
    expect(mars?.distanceAu).toBeGreaterThan(0);
  });
});

describe('alignment search', () => {
  it('finds a best date in a non-empty window', () => {
    const start = parseDateParts(1, 1, 2024);
    const end = addDays(start, 30);
    const result = findBestAlignment(start, end, 'pairwiseSum', 'true');
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
    expect(metricLabel(result!.metric)).toContain('AU');
  });

  it('returns null for empty ranges', () => {
    const start = parseDateParts(1, 1, 2024);
    const result = findBestAlignment(start, start, 'pairwiseSum', 'true');
    expect(result).toBeNull();
  });

  it('finds closest pair dates', () => {
    const start = parseDateParts(1, 1, 2020);
    const end = addDays(start, 400);
    const result = findClosestPair('jupiter', 'saturn', start, end, 'true');
    expect(result).not.toBeNull();
    expect(result!.distanceAu).toBeGreaterThan(0);
  });

  it('completes a 10-year search quickly with fixed budget', () => {
    const start = parseDateParts(1, 1, 2010);
    const end = addDays(start, 10 * 365);
    const t0 = performance.now();
    const result = findBestAlignment(start, end, 'pairwiseSum', 'true');
    const elapsed = performance.now() - t0;
    expect(result).not.toBeNull();
    expect(result!.date.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(result!.date.getTime()).toBeLessThan(end.getTime());
    expect(elapsed).toBeLessThan(2000);
  });

  it('matches or beats coarse brute force on a short window', () => {
    const start = parseDateParts(1, 1, 2024);
    const end = addDays(start, 90);
    const fast = findBestAlignment(start, end, 'pairwiseSum', 'true')!;

    let bruteScore = Number.POSITIVE_INFINITY;
    for (const date of enumerateDates(start, end, 30)) {
      const positions = getSolarSystemSnapshot(date, 'true').positions;
      const planets = positions.filter((p) => p.id !== 'sun');
      let sum = 0;
      for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
          sum += Math.hypot(
            planets[i]!.xAu - planets[j]!.xAu,
            planets[i]!.yAu - planets[j]!.yAu,
            planets[i]!.zAu - planets[j]!.zAu,
          );
        }
      }
      bruteScore = Math.min(bruteScore, sum);
    }

    expect(fast.score).toBeLessThanOrEqual(bruteScore * 1.05);
  });

  it('minimizeOnInterval returns null for empty interval', () => {
    const start = parseDateParts(1, 1, 2024);
    expect(minimizeOnInterval(start, start, () => 0)).toBeNull();
  });

  it('pairDistanceAu is symmetric', () => {
    const date = parseDateParts(15, 6, 2024);
    expect(pairDistanceAu('mars', 'jupiter', date)).toBeCloseTo(pairDistanceAu('jupiter', 'mars', date), 8);
  });
});

describe('planet calendar presets', () => {
  it('applies jupiter-saturn 2020 preset', () => {
    const preset = applyPlanetCalendarPreset('jupiterSaturn2020');
    expect(preset.mode).toBe('snapshot');
    expect(preset.day).toBe(21);
    expect(preset.month).toBe(12);
    expect(preset.year).toBe(2020);
    expect(preset.pairA).toBe('jupiter');
    expect(preset.pairB).toBe('saturn');
  });

  it('applies planet parade preset as alignment mode', () => {
    const preset = applyPlanetCalendarPreset('planetParade');
    expect(preset.mode).toBe('alignment');
    expect(preset.alignmentMetric).toBe('pairwiseSum');
  });
});

describe('cluster score', () => {
  it('returns finite scores', () => {
    const date = parseDateParts(1, 1, 2024);
    expect(clusterScore(date, 'pairwiseSum')).toBeGreaterThan(0);
    expect(clusterScore(date, 'maxPairwise')).toBeGreaterThan(0);
    expect(clusterScore(date, 'chainByLongitude')).toBeGreaterThan(0);
  });
});
