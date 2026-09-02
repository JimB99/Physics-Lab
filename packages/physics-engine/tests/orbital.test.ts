import { describe, expect, it } from 'vitest';
import { Body } from 'astronomy-engine';
import { clusterScore, clusterScoreAu, findBestAlignment, findClosestPair, metricLabel, pairDistanceAu } from '../src/orbital/alignment';
import { ORBITAL_BODIES } from '../src/orbital/bodies';
import { addDays, enumerateDates, formatIsoDate, formatIsoDateTime, parseDateParts, parseIsoDate, validateDateParts } from '../src/orbital/dates';
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
    expect(formatIsoDate(date)).toBe('2000-01-01');
    expect(formatIsoDate(addDays(date, 365))).toBe('2000-12-31');
  });

  it('formats a date and time in UTC', () => {
    expect(formatIsoDateTime(new Date(Date.UTC(2026, 8, 1, 7, 5)))).toBe('2026-09-01 07:05 UTC');
  });

  it('round-trips years below 100 that Date.UTC would remap into 1900–1999', () => {
    const date = parseDateParts(15, 3, 50);
    expect(date.getUTCFullYear()).toBe(50);
    expect(formatIsoDate(date)).toBe('0050-03-15');
    expect(validateDateParts(1, 1, 1)).toBeNull();
    expect(parseDateParts(1, 1, 1).getUTCFullYear()).toBe(1);
    expect(parseDateParts(1, 1, 99).getUTCFullYear()).toBe(99);
    expect(validateDateParts(1, 1, 10000)).toContain('Year must be between');
  });

  it('parses ISO dates and rejects malformed ones', () => {
    expect(formatIsoDate(parseIsoDate('2026-02-28')!)).toBe('2026-02-28');
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('nope')).toBeNull();
    expect(parseIsoDate('2026-2-8')).toBeNull();
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
  it('computes VSOP87 positions for years below 100', () => {
    const snapshot = getSolarSystemSnapshot(parseDateParts(1, 1, 50), 'true');
    const earth = snapshot.positions.find((p) => p.id === 'earth');
    expect(earth?.distanceAu).toBeGreaterThan(0.9);
    expect(earth?.distanceAu).toBeLessThan(1.1);
  });

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
    expect(preset.searchKind).toBe('cluster');
  });

  it('applies the straight-line preset', () => {
    const preset = applyPlanetCalendarPreset('planetLine');
    expect(preset.mode).toBe('alignment');
    expect(preset.alignmentMetric).toBe('collinear');
    expect(preset.searchKind).toBe('cluster');
    expect(preset.scaleMode).toBe('true');
  });

  it('applies mercury-venus as a pair search', () => {
    const preset = applyPlanetCalendarPreset('mercuryVenusClosest');
    expect(preset.searchKind).toBe('pair');
    expect(preset.pairA).toBe('mercury');
    expect(preset.pairB).toBe('venus');
  });
});

describe('cluster score', () => {
  it('returns finite scores for every metric', () => {
    const date = parseDateParts(1, 1, 2024);
    expect(clusterScore(date, 'pairwiseSum')).toBeGreaterThan(0);
    expect(clusterScore(date, 'maxPairwise')).toBeGreaterThan(0);
    expect(clusterScore(date, 'chainByLongitude')).toBeGreaterThan(0);
    expect(clusterScoreAu(date, 'collinear')).toBeGreaterThan(0);
    expect(clusterScoreAu(date, 'syzygy')).toBeGreaterThan(0);
  });

  it('reports AU-scale magnitudes for the AU objective', () => {
    const date = parseDateParts(1, 1, 2024);
    const score = clusterScoreAu(date, 'pairwiseSum');
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(2000);
  });

  it('the chain metric is unaffected by rotating the whole system past 0 degrees', () => {
    const a = clusterScoreAu(parseDateParts(1, 1, 2024), 'chainByLongitude');
    const b = clusterScoreAu(parseDateParts(1, 7, 2024), 'chainByLongitude');
    expect(Math.max(a, b) / Math.min(a, b)).toBeLessThan(3);
  });

  it('the chain metric never exceeds the pairwise-sum metric', () => {
    const date = parseDateParts(15, 6, 2030);
    expect(clusterScoreAu(date, 'chainByLongitude')).toBeLessThan(
      clusterScoreAu(date, 'pairwiseSum'),
    );
  });
});

describe('alignment search accuracy', () => {
  it('beats a 10-day brute-force scan over a 15-year window', () => {
    const start = parseDateParts(1, 1, 2026);
    const end = addDays(start, 15 * 365);

    const fast = findBestAlignment(start, end, 'pairwiseSum', 'true')!;

    let bruteScore = Number.POSITIVE_INFINITY;
    for (const date of enumerateDates(start, end, 10)) {
      bruteScore = Math.min(bruteScore, clusterScoreAu(date, 'pairwiseSum'));
    }

    expect(fast.score).toBeLessThanOrEqual(bruteScore);
  });

  it('reports the score it actually minimised', () => {
    const start = parseDateParts(1, 1, 2026);
    const end = addDays(start, 5 * 365);
    const result = findBestAlignment(start, end, 'pairwiseSum', 'true')!;
    expect(result.score).toBeCloseTo(clusterScoreAu(result.date, 'pairwiseSum'), 6);
  });

  it('stays under 8 seconds for a 15-year window', () => {
    const start = parseDateParts(1, 1, 2026);
    const end = addDays(start, 15 * 365);
    const t0 = performance.now();
    findBestAlignment(start, end, 'pairwiseSum', 'true');
    expect(performance.now() - t0).toBeLessThan(8000);
  });
});
