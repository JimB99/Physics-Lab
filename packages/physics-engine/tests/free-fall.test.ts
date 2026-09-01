import { describe, expect, it } from 'vitest';
import { G0 } from '../src/constants';
import { computeVertical1DSummary } from '../src/motion/free-fall';
import { sampleVertical1DTrajectory } from '../src/motion/kinematics';

const earthEnv = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('constants', () => {
  it('G0 is standard gravity', () => {
    expect(G0).toBe(9.80665);
  });
});

describe('free fall', () => {
  it('drops from 10 m at rest on Earth', () => {
    const summary = computeVertical1DSummary({ h0: 10, v0: 0 }, earthEnv);
    expect(summary).not.toBeNull();
    expect(summary!.flightTime).toBeCloseTo(1.428, 2);
    expect(summary!.impactVelocityY).toBeCloseTo(-14.0, 0);
    expect(summary!.impactSpeed).toBeCloseTo(14.0, 0);
  });

  it('conserves mechanical energy along trajectory', () => {
    const samples = sampleVertical1DTrajectory(10, 0, earthEnv, { step: 0.1 });
    const E0 = samples[0]!.totalMechanicalEnergy;
    for (const s of samples) {
      expect(s.totalMechanicalEnergy).toBeCloseTo(E0, 4);
    }
  });
});
