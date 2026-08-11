import { describe, expect, it } from 'vitest';
import { computeComparisonTrajectories } from '../src/simulation/compare';

const env = { planet: 'earth' as const, g: 9.80665, mass: 1 };
const noAtm = { enabled: false, rho: 0, preset: 'moonVacuum' as const };
const noDrag = { mass: 1, g: 9.80665, rho: 0, cd: 0.47, area: 0.01 };

describe('computeComparisonTrajectories', () => {
  it('returns series for multiple variants', () => {
    const moonEnv = { planet: 'moon' as const, g: 1.62, mass: 1 };
    const series = computeComparisonTrajectories(
      'vertical1d',
      [
        { id: 'a', label: 'Earth', color: '#4da3ff', env, atmosphere: noAtm, drag: noDrag, inputs: { h0: 10, v0: 0 } },
        { id: 'b', label: 'Moon', color: '#3dd68c', env: moonEnv, atmosphere: noAtm, drag: { ...noDrag, g: 1.62 }, inputs: { h0: 10, v0: 0 } },
      ],
      { step: 0.1 },
    );
    expect(series).toHaveLength(2);
    expect(series[0]!.samples.length).toBeGreaterThan(0);
    expect(series[1]!.samples.length).toBeGreaterThan(0);
    expect(series[0]!.samples[series[0]!.samples.length - 1]!.t).toBeLessThan(
      series[1]!.samples[series[1]!.samples.length - 1]!.t,
    );
  });
});
