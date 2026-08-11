import { describe, expect, it } from 'vitest';
import { firstImpactTime } from '../src/motion/kinematics';
import { integrateVertical1D } from '../src/simulation/integrator';
import { terminalVelocity } from '../src/forces/drag';

const env = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('drag integration', () => {
  it('rho=0 matches analytical impact time within 2%', () => {
    const h0 = 10;
    const v0 = 0;
    const analytical = firstImpactTime(h0, v0, env.g)!;
    const drag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(h0, v0, env, drag, { step: 0.05 });
    const numerical = samples[samples.length - 1]!.t;
    expect(Math.abs(numerical - analytical) / analytical).toBeLessThan(0.02);
  });

  it('terminal velocity matches formula', () => {
    const vt = terminalVelocity(1, 9.80665, 1.225, 0.47, 0.01);
    expect(vt).toBeCloseTo(58.5, 0);
  });

  it('mechanical energy decreases with drag', () => {
    const drag = { mass: 1, g: env.g, rho: 1.225, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(100, 0, env, drag, { step: 0.05 });
    const E0 = samples[0]!.totalMechanicalEnergy;
    const mid = samples[Math.floor(samples.length / 2)]!;
    expect(mid.totalMechanicalEnergy).toBeLessThan(E0);
  });
});
