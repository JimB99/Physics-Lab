import type { CelestialBody, CelestialBodyId } from './types';

export const G0 = 9.80665;

export const CELESTIAL_BODIES: CelestialBody[] = [
  { id: 'mercury', name: 'Mercury', kind: 'planet', surfaceGravity: 3.7, referenceNote: 'NASA fact sheet, surface gravity' },
  { id: 'venus', name: 'Venus', kind: 'planet', surfaceGravity: 8.87, referenceNote: 'NASA fact sheet, surface gravity' },
  { id: 'earth', name: 'Earth', kind: 'planet', surfaceGravity: 9.80665, referenceNote: 'Standard gravity (G₀)' },
  { id: 'mars', name: 'Mars', kind: 'planet', surfaceGravity: 3.71, referenceNote: 'NASA fact sheet, surface gravity' },
  { id: 'jupiter', name: 'Jupiter', kind: 'planet', surfaceGravity: 24.79, referenceNote: 'NASA fact sheet, surface gravity' },
  { id: 'saturn', name: 'Saturn', kind: 'planet', surfaceGravity: 10.44, referenceNote: 'NASA fact sheet, surface gravity' },
  { id: 'uranus', name: 'Uranus', kind: 'planet', surfaceGravity: 8.87, referenceNote: 'NASA fact sheet, surface gravity' },
  { id: 'neptune', name: 'Neptune', kind: 'planet', surfaceGravity: 11.15, referenceNote: 'NASA fact sheet, surface gravity' },
  { id: 'moon', name: 'Moon', kind: 'moon', surfaceGravity: 1.62, referenceNote: "Earth's moon, NASA fact sheet" },
  { id: 'sun', name: 'Sun', kind: 'star', surfaceGravity: 274.0, referenceNote: 'Surface gravity at photosphere; orbital mechanics not modeled' },
];

export const CELESTIAL_BODY_MAP: Record<Exclude<CelestialBodyId, 'custom'>, CelestialBody> =
  Object.fromEntries(CELESTIAL_BODIES.map((b) => [b.id, b])) as Record<
    Exclude<CelestialBodyId, 'custom'>,
    CelestialBody
  >;

export function getCelestialBody(id: CelestialBodyId): CelestialBody | null {
  if (id === 'custom') return null;
  return CELESTIAL_BODY_MAP[id];
}

export function resolveGravity(planet: CelestialBodyId, customG?: number): number {
  if (planet === 'custom') {
    if (customG === undefined || !Number.isFinite(customG) || customG <= 0) {
      throw new Error('Custom gravity must be a positive number');
    }
    return customG;
  }
  return CELESTIAL_BODY_MAP[planet].surfaceGravity;
}
