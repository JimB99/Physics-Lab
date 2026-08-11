import { describe, expect, it } from 'vitest';
import { computeProjectileSummary } from '../src/motion/projectile';

const earthEnv = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('projectile', () => {
  it('45 degree launch on flat ground', () => {
    const summary = computeProjectileSummary({ h0: 0, v0: 20, angleDeg: 45 }, earthEnv);
    expect(summary!.horizontalDistance).toBeCloseTo(40.8, 0);
    expect(summary!.maxHeight).toBeCloseTo(10.2, 0);
  });

  it('launch from elevated height', () => {
    const summary = computeProjectileSummary({ h0: 10, v0: 15, angleDeg: 30 }, earthEnv);
    expect(summary!.flightTime).toBeGreaterThan(0);
    expect(summary!.horizontalDistance).toBeGreaterThan(0);
  });
});
