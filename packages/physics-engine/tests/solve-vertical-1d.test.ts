import { describe, expect, it } from 'vitest';
import { solveVertical1D } from '../src/solve/vertical-1d';
import type { FieldSpec, Vertical1DFieldId } from '../src/solve/types';

const earthEnv = { planet: 'earth' as const, g: 9.80665, mass: 1 };

function fields(specs: [Vertical1DFieldId, 'given' | 'solve', number?][]): FieldSpec<Vertical1DFieldId>[] {
  return specs.map(([id, mode, value]) => ({ id, mode, value }));
}

describe('solveVertical1D', () => {
  it('given h0, v0 solves impact', () => {
    const result = solveVertical1D(
      fields([
        ['h0', 'given', 10],
        ['v0', 'given', 0],
        ['impactTime', 'solve'],
        ['impactVelocity', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.impactTime).toBeCloseTo(1.428, 2);
      expect(result.values.impactVelocity).toBeCloseTo(-14.0, 0);
    }
  });

  it('given h0, v0, t solves y and v', () => {
    const result = solveVertical1D(
      fields([
        ['h0', 'given', 10],
        ['v0', 'given', 0],
        ['t', 'given', 1],
        ['y', 'solve'],
        ['v', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.y).toBeCloseTo(5.097, 2);
      expect(result.values.v).toBeCloseTo(-9.807, 2);
    }
  });

  it('given only h0 is underdetermined', () => {
    const result = solveVertical1D(
      fields([
        ['h0', 'given', 10],
        ['v0', 'solve'],
        ['impactTime', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('underdetermined');
  });

  it('given v, t, h0 solves v0', () => {
    const result = solveVertical1D(
      fields([
        ['h0', 'given', 10],
        ['t', 'given', 1],
        ['v', 'given', -9.80665],
        ['v0', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.v0).toBeCloseTo(0, 2);
    }
  });
});
