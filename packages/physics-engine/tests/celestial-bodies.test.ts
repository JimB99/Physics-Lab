import { describe, expect, it } from 'vitest';
import { CELESTIAL_BODIES, resolveGravity, getCelestialBody } from '../src/constants';

describe('celestial bodies', () => {
  it('has positive gravity for all bodies', () => {
    for (const body of CELESTIAL_BODIES) {
      expect(body.surfaceGravity).toBeGreaterThan(0);
    }
  });

  it('Sun > Jupiter > Earth > Moon', () => {
    expect(resolveGravity('sun')).toBe(274);
    expect(resolveGravity('sun')).toBeGreaterThan(resolveGravity('jupiter'));
    expect(resolveGravity('jupiter')).toBeGreaterThan(resolveGravity('earth'));
    expect(resolveGravity('earth')).toBeGreaterThan(resolveGravity('moon'));
  });

  it('resolveGravity returns correct values', () => {
    expect(resolveGravity('mercury')).toBe(3.7);
    expect(resolveGravity('venus')).toBe(8.87);
    expect(resolveGravity('neptune')).toBe(11.15);
  });

  it('getCelestialBody returns metadata', () => {
    const sun = getCelestialBody('sun');
    expect(sun?.kind).toBe('star');
    expect(sun?.name).toBe('Sun');
  });
});
