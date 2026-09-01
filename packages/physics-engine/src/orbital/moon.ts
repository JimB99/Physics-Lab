import { Body, Illumination, MoonPhase, NextMoonQuarter, SearchMoonQuarter } from 'astronomy-engine';
import { formatIsoDateTime } from './dates';

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface MoonPhaseInfo {
  date: Date;
  phaseAngleDeg: number;
  name: MoonPhaseName;
  illuminationFraction: number;
}

export interface MoonPhaseEvent {
  date: Date;
  name: MoonPhaseName;
  phaseAngleDeg: number;
}

const QUARTER_NAMES: MoonPhaseName[] = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];

function phaseNameFromAngle(angle: number): MoonPhaseName {
  const a = ((angle % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'New Moon';
  if (a < 67.5) return 'Waxing Crescent';
  if (a < 112.5) return 'First Quarter';
  if (a < 157.5) return 'Waxing Gibbous';
  if (a < 202.5) return 'Full Moon';
  if (a < 247.5) return 'Waning Gibbous';
  if (a < 292.5) return 'Last Quarter';
  return 'Waning Crescent';
}

function quarterToAngle(quarter: number): number {
  return (quarter % 4) * 90;
}

export function getMoonPhase(date: Date): MoonPhaseInfo {
  const phaseAngleDeg = MoonPhase(date);
  return {
    date: new Date(date.getTime()),
    phaseAngleDeg,
    name: phaseNameFromAngle(phaseAngleDeg),
    illuminationFraction: Illumination(Body.Moon, date).phase_fraction,
  };
}

const MAX_QUARTER_ITERATIONS = 400;

export function findUpcomingQuarters(start: Date, count: number): MoonPhaseEvent[] {
  if (count < 1) return [];

  const events: MoonPhaseEvent[] = [];
  let quarter = SearchMoonQuarter(start);
  let iterations = 0;

  while (events.length < count && iterations < MAX_QUARTER_ITERATIONS) {
    iterations++;
    const date = quarter.time.date;
    const phaseAngleDeg = quarterToAngle(quarter.quarter);
    events.push({
      date,
      name: QUARTER_NAMES[quarter.quarter] ?? phaseNameFromAngle(phaseAngleDeg),
      phaseAngleDeg,
    });
    quarter = NextMoonQuarter(quarter);
  }

  return events;
}

export function formatMoonEvent(event: MoonPhaseEvent): string {
  return `${event.name} — ${formatIsoDateTime(event.date)}`;
}
