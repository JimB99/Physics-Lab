import { describe, expect, it } from 'vitest';
import { validateEnvironment, validateVertical1DInputs } from '../src/motion/free-fall';
import { validateProjectileInputs } from '../src/motion/projectile';

describe('validateEnvironment', () => {
  it('rejects non-positive mass', () => {
    const result = validateEnvironment({ planet: 'earth', g: 9.80665, mass: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Mass');
  });

  it('rejects non-positive gravity', () => {
    expect(validateEnvironment({ planet: 'custom', g: 0, mass: 1 }).valid).toBe(false);
    expect(validateEnvironment({ planet: 'custom', g: -3, mass: 1 }).valid).toBe(false);
  });

  it('accepts a sane environment', () => {
    expect(validateEnvironment({ planet: 'earth', g: 9.80665, mass: 2 }).valid).toBe(true);
  });
});

describe('validateVertical1DInputs', () => {
  it('rejects a negative initial height', () => {
    expect(validateVertical1DInputs({ h0: -1, v0: 0 }).valid).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validateVertical1DInputs({ h0: Number.NaN, v0: 0 }).valid).toBe(false);
  });

  it('accepts a downward throw', () => {
    expect(validateVertical1DInputs({ h0: 10, v0: -5 }).valid).toBe(true);
  });
});

describe('validateProjectileInputs', () => {
  it('rejects an angle above 90 degrees', () => {
    expect(validateProjectileInputs({ h0: 0, v0: 10, angleDeg: 120 }).valid).toBe(false);
  });

  it('rejects a negative launch speed', () => {
    expect(validateProjectileInputs({ h0: 0, v0: -10, angleDeg: 45 }).valid).toBe(false);
  });

  it('accepts a level launch', () => {
    expect(validateProjectileInputs({ h0: 5, v0: 10, angleDeg: 0 }).valid).toBe(true);
  });
});
