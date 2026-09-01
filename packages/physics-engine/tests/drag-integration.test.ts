import { describe, expect, it } from 'vitest';
import { firstImpactTime } from '../src/motion/kinematics';
import { integrateProjectile2D, integrateVertical1D } from '../src/simulation/integrator';
import { terminalVelocity } from '../src/forces/drag';

const env = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('drag integration', () => {
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

  it('lands exactly on the ground with drag', () => {
    const drag = { mass: 1, g: env.g, rho: 1.225, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(100, 0, env, drag, { step: 0.05 });
    expect(samples[samples.length - 1]!.y).toBe(0);
  });

  it('rho=0 matches the analytical impact time within 0.1%', () => {
    const analytical = firstImpactTime(100, 0, env.g)!;
    const drag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(100, 0, env, drag, { step: 0.05 });
    const numerical = samples[samples.length - 1]!.t;
    expect(samples[samples.length - 1]!.y).toBe(0);
    expect(Math.abs(numerical - analytical) / analytical).toBeLessThan(0.001);
  });

  it('a body thrown upward from the ground still lands on the ground', () => {
    const drag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(0, 20, env, drag, { step: 0.05 });
    expect(samples.length).toBeGreaterThan(2);
    expect(samples[samples.length - 1]!.y).toBe(0);
    expect(samples[samples.length - 1]!.t).toBeCloseTo((2 * 20) / env.g, 2);
  });

  it('a body already on the ground at rest produces a single sample', () => {
    const drag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(0, 0, env, drag, { step: 0.05 });
    expect(samples).toHaveLength(1);
    expect(samples[0]!.t).toBe(0);
  });
});

describe('projectile integration', () => {
  it('lands exactly on the ground', () => {
    const drag = { mass: 1, g: env.g, rho: 1.225, cd: 0.47, area: 0.01 };
    const samples = integrateProjectile2D(0, 30, 45, env, drag, { step: 0.05 });
    expect(samples[samples.length - 1]!.y).toBe(0);
    expect(samples[samples.length - 1]!.x).toBeGreaterThan(0);
  });

  it('rho=0 matches the analytical range within 0.5%', () => {
    const noDrag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateProjectile2D(0, 20, 45, env, noDrag, { step: 0.05 });
    const analyticalRange = (20 * 20 * Math.sin((2 * 45 * Math.PI) / 180)) / env.g;
    const numericalRange = samples[samples.length - 1]!.x;
    expect(Math.abs(numericalRange - analyticalRange) / analyticalRange).toBeLessThan(0.005);
  });
});
