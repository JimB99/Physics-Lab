import { describe, expect, it } from 'vitest';
import { computeVertical1DSummary } from '../src/motion/free-fall';

const earthEnv = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('vertical throw', () => {
  it('throws upward 10 m/s from ground', () => {
    const summary = computeVertical1DSummary({ h0: 0, v0: 10 }, earthEnv);
    expect(summary!.maxHeight).toBeCloseTo(5.1, 0);
    expect(summary!.timeToMaxHeight).toBeCloseTo(1.02, 1);
  });

  it('throws downward from 20 m', () => {
    const summary = computeVertical1DSummary({ h0: 20, v0: -5 }, earthEnv);
    expect(summary!.flightTime).toBeGreaterThan(0);
    expect(summary!.impactVelocity).toBeLessThan(-5);
  });
});
