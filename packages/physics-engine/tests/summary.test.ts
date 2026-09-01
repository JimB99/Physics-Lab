import { describe, expect, it } from 'vitest';
import { integrateProjectile2D, integrateVertical1D } from '../src/simulation/integrator';
import { summarizeSamples } from '../src/simulation/summary';
import { computeVertical1DSummary } from '../src/motion/free-fall';

const env = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('summarizeSamples', () => {
  it('returns null for an empty sample set', () => {
    expect(summarizeSamples([])).toBeNull();
  });

  it('reports a slower impact with drag than in vacuum', () => {
    const drag = { mass: 1, g: env.g, rho: 1.225, cd: 0.47, area: 0.01 };
    const dragSummary = summarizeSamples(integrateVertical1D(100, 0, env, drag, { step: 0.05 }))!;
    const vacuumSummary = computeVertical1DSummary({ h0: 100, v0: 0 }, env)!;

    expect(dragSummary.impactSpeed).toBeGreaterThan(0);
    expect(dragSummary.impactSpeed).toBeLessThan(vacuumSummary.impactSpeed);
    expect(dragSummary.flightTime).toBeGreaterThan(vacuumSummary.flightTime);
    expect(dragSummary.impactVelocityY).toBeLessThan(0);
  });

  it('finds the apex of an upward throw', () => {
    const noDrag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const summary = summarizeSamples(integrateVertical1D(0, 20, env, noDrag, { step: 0.01 }))!;
    expect(summary.maxHeight).toBeCloseTo((20 * 20) / (2 * env.g), 1);
    expect(summary.timeToMaxHeight).toBeCloseTo(20 / env.g, 1);
  });

  it('reports horizontal distance and impact angle for a 2D run', () => {
    const noDrag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const summary = summarizeSamples(integrateProjectile2D(0, 20, 45, env, noDrag, { step: 0.01 }))!;
    expect(summary.horizontalDistance).toBeCloseTo(40.8, 0);
    expect(summary.impactAngle).toBeCloseTo(-45, 0);
  });

  it('omits horizontal fields for a purely vertical run', () => {
    const noDrag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const summary = summarizeSamples(integrateVertical1D(10, 0, env, noDrag, { step: 0.01 }))!;
    expect(summary.horizontalDistance).toBeUndefined();
    expect(summary.impactAngle).toBeUndefined();
  });
});
