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
});
