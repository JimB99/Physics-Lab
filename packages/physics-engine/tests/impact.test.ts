import { describe, expect, it } from 'vitest';
import { computeImpact } from '../src/impact';

describe('computeImpact', () => {
  it('stopping time model', () => {
    const result = computeImpact({
      mass: 1,
      impactSpeed: 10,
      model: 'stoppingTime',
      stoppingTime: 0.01,
    });
    expect('averageForce' in result && result.averageForce).toBe(1000);
  });

  it('stopping distance model', () => {
    const result = computeImpact({
      mass: 1,
      impactSpeed: 10,
      model: 'stoppingDistance',
      stoppingDistance: 0.05,
    });
    expect('averageForce' in result && result.averageForce).toBe(1000);
  });

  it('pressure with contact area', () => {
    const result = computeImpact({
      mass: 1,
      impactSpeed: 10,
      model: 'stoppingTime',
      stoppingTime: 0.01,
      contactArea: 0.01,
    });
    expect('pressure' in result && result.pressure).toBe(100000);
  });

  it('returns validation errors', () => {
    const result = computeImpact({
      mass: 0,
      impactSpeed: 10,
      model: 'stoppingTime',
      stoppingTime: 0.01,
    });
    expect('valid' in result && result.valid).toBe(false);
  });
});
