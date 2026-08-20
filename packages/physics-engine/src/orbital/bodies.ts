import { Body } from 'astronomy-engine';
import type { OrbitalPlanetId } from './types';

export interface OrbitalBodyDefinition {
  id: OrbitalPlanetId;
  name: string;
  body: Body;
  color: string;
  /** Fixed diagram radius for schematic mode (not AU). */
  schematicRadius: number;
  markerSize: number;
}

export const ORBITAL_BODIES: OrbitalBodyDefinition[] = [
  { id: 'sun', name: 'Sun', body: Body.Sun, color: '#ffd700', schematicRadius: 0, markerSize: 8 },
  { id: 'mercury', name: 'Mercury', body: Body.Mercury, color: '#d3d3d3', schematicRadius: 2, markerSize: 4 },
  { id: 'venus', name: 'Venus', body: Body.Venus, color: '#d2b48c', schematicRadius: 4, markerSize: 4 },
  { id: 'earth', name: 'Earth', body: Body.Earth, color: '#4169e1', schematicRadius: 6, markerSize: 4 },
  { id: 'mars', name: 'Mars', body: Body.Mars, color: '#dc143c', schematicRadius: 8, markerSize: 4 },
  { id: 'jupiter', name: 'Jupiter', body: Body.Jupiter, color: '#f0e68c', schematicRadius: 10, markerSize: 5 },
  { id: 'saturn', name: 'Saturn', body: Body.Saturn, color: '#daa520', schematicRadius: 12, markerSize: 5 },
  { id: 'uranus', name: 'Uranus', body: Body.Uranus, color: '#40e0d0', schematicRadius: 14, markerSize: 4 },
  { id: 'neptune', name: 'Neptune', body: Body.Neptune, color: '#000080', schematicRadius: 16, markerSize: 4 },
];

export const ORBITAL_BODY_MAP: Record<OrbitalPlanetId, OrbitalBodyDefinition> = Object.fromEntries(
  ORBITAL_BODIES.map((b) => [b.id, b]),
) as Record<OrbitalPlanetId, OrbitalBodyDefinition>;

export const ORBITAL_PLANETS = ORBITAL_BODIES.filter((b) => b.id !== 'sun');
