import type { PlanetId } from './types';

export const G0 = 9.80665;

export const PLANET_GRAVITY: Record<Exclude<PlanetId, 'custom'>, number> = {
  earth: 9.80665,
  moon: 1.62,
  mars: 3.71,
};

export function resolveGravity(planet: PlanetId, customG?: number): number {
  if (planet === 'custom') {
    if (customG === undefined || !Number.isFinite(customG) || customG <= 0) {
      throw new Error('Custom gravity must be a positive number');
    }
    return customG;
  }
  return PLANET_GRAVITY[planet];
}
