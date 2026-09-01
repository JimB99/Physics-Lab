import { describe, expect, it } from 'vitest';
import { integrateVertical1D } from 'physics-engine';
import { samplesToCsv } from '../src/lib/exportCsv';

const env = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('samplesToCsv', () => {
  it('emits a header and one row per sample', () => {
    const samples = integrateVertical1D(10, 0, env, { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 }, { step: 0.1 });
    const lines = samplesToCsv(samples).trim().split('\n');
    expect(lines[0]).toBe('t,x,y,vx,vy,ax,ay,speed,kineticEnergy,potentialEnergy,totalMechanicalEnergy,gForce,gravitationalForce,dragForce,netForce');
    expect(lines.length).toBe(samples.length + 1);
  });

  it('writes empty cells for absent optional fields', () => {
    const samples = integrateVertical1D(10, 0, env, { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 }, { step: 0.1 });
    const stripped = samples.map((s) => ({ ...s, dragForce: undefined, netForce: undefined }));
    const firstRow = samplesToCsv(stripped).trim().split('\n')[1]!;
    expect(firstRow.endsWith(',,')).toBe(true);
  });

  it('returns only a header for an empty array', () => {
    expect(samplesToCsv([]).trim().split('\n')).toHaveLength(1);
  });
});
