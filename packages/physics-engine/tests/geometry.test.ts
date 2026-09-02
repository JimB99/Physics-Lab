import { describe, expect, it } from 'vitest';
import {
  bestFitLine2d,
  collinearRmsAu,
  radialRmsDeg,
  syzygyRmsDeg,
} from '../src/orbital/geometry';

describe('collinearRmsAu', () => {
  it('is ~0 for points that already lie on a line', () => {
    const rms = collinearRmsAu([
      { xAu: 0, yAu: 0 },
      { xAu: 1, yAu: 1 },
      { xAu: 2, yAu: 2 },
      { xAu: 3, yAu: 3 },
    ]);
    expect(rms).toBeLessThan(1e-10);
  });

  it('is larger when points form a square', () => {
    const line = collinearRmsAu([
      { xAu: 0, yAu: 0 },
      { xAu: 1, yAu: 0 },
      { xAu: 2, yAu: 0 },
    ]);
    const square = collinearRmsAu([
      { xAu: 0, yAu: 0 },
      { xAu: 1, yAu: 0 },
      { xAu: 1, yAu: 1 },
      { xAu: 0, yAu: 1 },
    ]);
    expect(square).toBeGreaterThan(line);
    expect(square).toBeGreaterThan(0.3);
  });

  it('is 0 for two points', () => {
    expect(collinearRmsAu([{ xAu: 0, yAu: 0 }, { xAu: 5, yAu: 2 }])).toBe(0);
  });
});

describe('bestFitLine2d', () => {
  it('returns a direction along the data for a diagonal line', () => {
    const line = bestFitLine2d([
      { xAu: 0, yAu: 0 },
      { xAu: 2, yAu: 2 },
      { xAu: 4, yAu: 4 },
    ]);
    expect(line).not.toBeNull();
    expect(Math.abs(line!.directionX)).toBeCloseTo(Math.abs(line!.directionY), 8);
    expect(line!.originX).toBeCloseTo(2, 8);
    expect(line!.originY).toBeCloseTo(2, 8);
  });
});

describe('radialRmsDeg', () => {
  it('is 0 when every longitude is the same', () => {
    expect(radialRmsDeg([40, 40, 40, 40])).toBe(0);
  });

  it('handles wrap-around near 0°', () => {
    expect(radialRmsDeg([1, 359, 0])).toBeLessThan(2);
  });

  it('is larger when longitudes are spread around the sky', () => {
    const tight = radialRmsDeg([10, 12, 8, 11]);
    const spread = radialRmsDeg([0, 90, 180, 270]);
    expect(spread).toBeGreaterThan(tight);
    expect(spread).toBeGreaterThan(50);
  });
});

describe('syzygyRmsDeg', () => {
  it('is 0 for a perfect line through the origin (conjunction and opposition)', () => {
    expect(syzygyRmsDeg([10, 10, 190, 190])).toBeLessThan(1e-8);
  });

  it('is smaller for a line than for a right angle', () => {
    expect(syzygyRmsDeg([0, 180])).toBeLessThan(syzygyRmsDeg([0, 90]));
  });
});
