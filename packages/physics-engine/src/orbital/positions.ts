import { degToRad } from '../units';
import { ORBITAL_BODIES } from './bodies';
import { heliocentricEcliptic } from './ephemeris';
import type { DisplayScaleMode, PlanetPosition, SolarSystemSnapshot } from './types';

/** Sun-relative radius used in log mode; 0.05 AU floor keeps log() finite. */
const LOG_FLOOR_AU = 0.05;

function toDisplayCoordinates(
  state: ReturnType<typeof heliocentricEcliptic>,
  schematicRadius: number,
  scaleMode: DisplayScaleMode,
): { displayX: number; displayY: number; orbitDisplayRadius: number } {
  if (scaleMode === 'true') {
    return {
      displayX: state.xAu,
      displayY: state.yAu,
      orbitDisplayRadius: state.distanceAu,
    };
  }

  const angle = degToRad(state.longitudeDeg);

  if (scaleMode === 'log') {
    const radius =
      state.distanceAu <= 0 ? 0 : Math.log10(Math.max(state.distanceAu, LOG_FLOOR_AU) / LOG_FLOOR_AU);
    return {
      displayX: radius * Math.cos(angle),
      displayY: radius * Math.sin(angle),
      orbitDisplayRadius: radius,
    };
  }

  return {
    displayX: schematicRadius * Math.cos(angle),
    displayY: schematicRadius * Math.sin(angle),
    orbitDisplayRadius: schematicRadius,
  };
}

export function getPlanetPosition(
  bodyIndex: number,
  date: Date,
  scaleMode: DisplayScaleMode,
): PlanetPosition {
  const def = ORBITAL_BODIES[bodyIndex]!;
  const state = heliocentricEcliptic(def.body, date);
  const display = toDisplayCoordinates(state, def.schematicRadius, scaleMode);

  return {
    id: def.id,
    name: def.name,
    color: def.color,
    xAu: state.xAu,
    yAu: state.yAu,
    zAu: state.zAu,
    distanceAu: state.distanceAu,
    longitudeDeg: state.longitudeDeg,
    latitudeDeg: state.latitudeDeg,
    displayX: display.displayX,
    displayY: display.displayY,
    orbitDisplayRadius: display.orbitDisplayRadius,
    markerSize: def.markerSize,
  };
}

export function getSolarSystemSnapshot(date: Date, scaleMode: DisplayScaleMode): SolarSystemSnapshot {
  return {
    date: new Date(date.getTime()),
    positions: ORBITAL_BODIES.map((_, index) => getPlanetPosition(index, date, scaleMode)),
  };
}
