import { describe, expect, it } from 'vitest';
import { moonDiskGeometry } from '../src/orbital/moon-disk';

describe('moonDiskGeometry', () => {
  it('new moon is fully dark with a full-width terminator', () => {
    const g = moonDiskGeometry(0);
    expect(g.illuminatedFraction).toBeCloseTo(0, 6);
    expect(g.terminatorAxisRatio).toBeCloseTo(1, 6);
    expect(g.gibbous).toBe(false);
  });

  it('first quarter is half lit on the right with a straight terminator', () => {
    const g = moonDiskGeometry(90);
    expect(g.illuminatedFraction).toBeCloseTo(0.5, 6);
    expect(g.terminatorAxisRatio).toBeCloseTo(0, 6);
    expect(g.litOnRight).toBe(true);
    expect(g.gibbous).toBe(false);
  });

  it('full moon is fully lit', () => {
    const g = moonDiskGeometry(180);
    expect(g.illuminatedFraction).toBeCloseTo(1, 6);
    expect(g.terminatorAxisRatio).toBeCloseTo(1, 6);
    expect(g.gibbous).toBe(true);
  });

  it('last quarter is half lit on the left', () => {
    const g = moonDiskGeometry(270);
    expect(g.illuminatedFraction).toBeCloseTo(0.5, 6);
    expect(g.litOnRight).toBe(false);
    expect(g.gibbous).toBe(false);
  });

  it('waxing gibbous is lit on the right and bulging', () => {
    const g = moonDiskGeometry(135);
    expect(g.litOnRight).toBe(true);
    expect(g.gibbous).toBe(true);
    expect(g.illuminatedFraction).toBeGreaterThan(0.5);
  });

  it('waning crescent is lit on the left and not bulging', () => {
    const g = moonDiskGeometry(315);
    expect(g.litOnRight).toBe(false);
    expect(g.gibbous).toBe(false);
    expect(g.illuminatedFraction).toBeLessThan(0.5);
  });

  it('normalises out-of-range angles', () => {
    expect(moonDiskGeometry(450).phaseAngleDeg).toBeCloseTo(90, 6);
    expect(moonDiskGeometry(-90).phaseAngleDeg).toBeCloseTo(270, 6);
  });
});
