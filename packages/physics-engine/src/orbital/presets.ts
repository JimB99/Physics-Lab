import { addDays, parseDateParts } from './dates';
import type { AlignmentMetric, OrbitalPlanetId } from './types';

export type PlanetCalendarPresetId =
  | 'today'
  | 'jupiterSaturn2020'
  | 'planetParade'
  | 'mercuryVenusClosest';

export interface PlanetCalendarPreset {
  id: PlanetCalendarPresetId;
  label: string;
  description: string;
}

export const PLANET_CALENDAR_PRESETS: PlanetCalendarPreset[] = [
  {
    id: 'today',
    label: "Today's sky",
    description: 'Snapshot of heliocentric positions for today (UTC).',
  },
  {
    id: 'jupiterSaturn2020',
    label: 'Jupiter–Saturn 2020',
    description: 'Great conjunction snapshot on 21 December 2020.',
  },
  {
    id: 'planetParade',
    label: 'Find next planet parade',
    description: 'Search the next 15 years for the tightest planetary cluster.',
  },
  {
    id: 'mercuryVenusClosest',
    label: 'Mercury–Venus closest (5 years)',
    description: 'Find the closest Mercury–Venus approach over the next five years.',
  },
];

export function todayUtcDate(): Date {
  const now = new Date();
  return parseDateParts(now.getUTCDate(), now.getUTCMonth() + 1, now.getUTCFullYear());
}

export interface PresetParams {
  mode: 'snapshot' | 'alignment';
  day: number;
  month: number;
  year: number;
  startDay: number;
  startMonth: number;
  startYear: number;
  endDay: number;
  endMonth: number;
  endYear: number;
  alignmentMetric: AlignmentMetric;
  pairA: OrbitalPlanetId;
  pairB: OrbitalPlanetId;
}

export function applyPlanetCalendarPreset(id: PlanetCalendarPresetId): PresetParams {
  const today = todayUtcDate();
  const t = {
    day: today.getUTCDate(),
    month: today.getUTCMonth() + 1,
    year: today.getUTCFullYear(),
  };

  switch (id) {
    case 'today':
      return {
        mode: 'snapshot',
        ...t,
        startDay: t.day,
        startMonth: t.month,
        startYear: t.year,
        endDay: t.day,
        endMonth: t.month,
        endYear: t.year,
        alignmentMetric: 'pairwiseSum',
        pairA: 'mars',
        pairB: 'jupiter',
      };
    case 'jupiterSaturn2020':
      return {
        mode: 'snapshot',
        day: 21,
        month: 12,
        year: 2020,
        startDay: 21,
        startMonth: 12,
        startYear: 2020,
        endDay: 22,
        endMonth: 12,
        endYear: 2020,
        alignmentMetric: 'pairwiseSum',
        pairA: 'jupiter',
        pairB: 'saturn',
      };
    case 'planetParade': {
      const end = addDays(today, 15 * 365);
      return {
        mode: 'alignment',
        ...t,
        startDay: t.day,
        startMonth: t.month,
        startYear: t.year,
        endDay: end.getUTCDate(),
        endMonth: end.getUTCMonth() + 1,
        endYear: end.getUTCFullYear(),
        alignmentMetric: 'pairwiseSum',
        pairA: 'mars',
        pairB: 'jupiter',
      };
    }
    case 'mercuryVenusClosest': {
      const end = addDays(today, 5 * 365);
      return {
        mode: 'alignment',
        ...t,
        startDay: t.day,
        startMonth: t.month,
        startYear: t.year,
        endDay: end.getUTCDate(),
        endMonth: end.getUTCMonth() + 1,
        endYear: end.getUTCFullYear(),
        alignmentMetric: 'pairwiseSum',
        pairA: 'mercury',
        pairB: 'venus',
      };
    }
  }
}
