import { describe, expect, it } from 'vitest';
import { solveProjectile } from '../src/solve/projectile';
import type { FieldSpec, ProjectileFieldId } from '../src/solve/types';

const earthEnv = { planet: 'earth' as const, g: 9.80665, mass: 1 };

function fields(specs: [ProjectileFieldId, 'given' | 'solve', number?][]): FieldSpec<ProjectileFieldId>[] {
  return specs.map(([id, mode, value]) => ({ id, mode, value }));
}

describe('solveProjectile', () => {
  it('given h0, v0, angle solves range and flight time', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['angle', 'given', 45],
        ['range', 'solve'],
        ['flightTime', 'solve'],
        ['maxHeight', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.range).toBeCloseTo(40.8, 0);
      expect(result.values.maxHeight).toBeCloseTo(10.2, 0);
    }
  });

  it('given h0, v0, angle, t solves x and y', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['angle', 'given', 45],
        ['t', 'given', 1],
        ['x', 'solve'],
        ['y', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.x).toBeGreaterThan(0);
      expect(result.values.y).toBeGreaterThan(0);
    }
  });

  it('derives v0 and angle from the velocity components', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['vx', 'given', 10],
        ['vy', 'given', 10],
        ['v0', 'solve'],
        ['angle', 'solve'],
        ['range', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.v0).toBeCloseTo(Math.SQRT2 * 10, 4);
      expect(result.values.angle).toBeCloseTo(45, 4);
      expect(result.values.range).toBeCloseTo(20.394, 2);
    }
  });

  it('solves for the launch angle that produces a given range', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['range', 'given', 40.7886],
        ['angle', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.angle).toBeCloseTo(45, 1);
      expect(result.multiValues?.angle?.length).toBe(2);
    }
  });

  it('rejects a range that exceeds the maximum for the given speed', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 10],
        ['range', 'given', 1000],
        ['angle', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('noSolution');
  });

  it('computes the speed at a given time', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['angle', 'given', 90],
        ['t', 'given', 1],
        ['v', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.v).toBeCloseTo(20 - earthEnv.g, 3);
    }
  });

  it('reports contradictory given values as overconstrained', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['angle', 'given', 45],
        ['range', 'given', 5],
        ['flightTime', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('overconstrained');
  });

  it('reports a field given twice with different values', () => {
    const result = solveProjectile(
      fields([
        ['v0', 'given', 20],
        ['v0', 'given', 30],
        ['range', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('overconstrained');
  });

  it('solves range even when time-point fields are also marked solve', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['angle', 'given', 45],
        ['t', 'solve'],
        ['x', 'solve'],
        ['y', 'solve'],
        ['v', 'solve'],
        ['range', 'solve'],
        ['flightTime', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.range).toBeCloseTo(40.8, 0);
      expect(result.values.t).toBeUndefined();
    }
  });
});
