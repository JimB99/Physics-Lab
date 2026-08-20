import { MoonPhase, NextMoonQuarter, SearchMoonPhase, SearchMoonQuarter } from 'astronomy-engine';
import { addDays, formatDateString } from './dates';

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

const PHASE_TARGETS: { angle: number; name: MoonPhaseName }[] = [
  { angle: 0, name: 'New Moon' },
  { angle: 90, name: 'First Quarter' },
  { angle: 180, name: 'Full Moon' },
  { angle: 270, name: 'Last Quarter' },
];

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

function illuminationFromAngle(angle: number): number {
  const a = ((angle % 360) + 360) % 360;
  return (1 - Math.cos((a * Math.PI) / 180)) / 2;
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
    illuminationFraction: illuminationFromAngle(phaseAngleDeg),
  };
}

export function findUpcomingPhases(start: Date, count: number): MoonPhaseEvent[] {
  if (count < 1) return [];

  const events: MoonPhaseEvent[] = [];
  let cursor = new Date(start.getTime());

  while (events.length < count) {
    let best: MoonPhaseEvent | null = null;

    for (const target of PHASE_TARGETS) {
      const found = SearchMoonPhase(target.angle, cursor, 40);
      if (!found) continue;
      const date = found.date;
      if (date.getTime() <= cursor.getTime()) continue;
      const event: MoonPhaseEvent = {
        date,
        name: target.name,
        phaseAngleDeg: target.angle,
      };
      if (!best || event.date.getTime() < best.date.getTime()) {
        best = event;
      }
    }

    if (!best) break;
    events.push(best);
    cursor = addDays(best.date, 1);
  }

  return events;
}

export function findUpcomingQuarters(start: Date, count: number): MoonPhaseEvent[] {
  if (count < 1) return [];

  const events: MoonPhaseEvent[] = [];
  let quarter = SearchMoonQuarter(start);

  while (events.length < count) {
    const date = quarter.time.date;
    if (date.getTime() > start.getTime() || events.length > 0) {
      const phaseAngleDeg = quarterToAngle(quarter.quarter);
      events.push({
        date,
        name: QUARTER_NAMES[quarter.quarter] ?? phaseNameFromAngle(phaseAngleDeg),
        phaseAngleDeg,
      });
    }
    quarter = NextMoonQuarter(quarter);
  }

  return events;
}

export function formatMoonEvent(event: MoonPhaseEvent): string {
  return `${event.name} — ${formatDateString(event.date)}`;
}
