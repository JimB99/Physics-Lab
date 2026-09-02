import { addDays, parseDateParts } from './dates';
import type { AlignmentMetric, AlignmentSearchKind, DisplayScaleMode, OrbitalPlanetId } from './types';

export type PlanetCalendarPresetId =
  | 'today'
  | 'jupiterSaturn2020'
  | 'planetParade'
  | 'planetLine'
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
    label: 'Tightest cluster (15 years)',
    description: 'Search the next 15 years for the smallest planetary cluster.',
  },
  {
    id: 'planetLine',
    label: 'Straightest line (15 years)',
    description: 'Search the next 15 years for the date when the planets form the straightest line.',
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
  searchKind: AlignmentSearchKind;
  scaleMode: DisplayScaleMode;
  pairA: OrbitalPlanetId;
  pairB: OrbitalPlanetId;
}

function rangeFromToday(days: number) {
  const today = todayUtcDate();
  const t = {
    day: today.getUTCDate(),
    month: today.getUTCMonth() + 1,
    year: today.getUTCFullYear(),
  };
  const end = addDays(today, days);
  return {
    ...t,
    startDay: t.day,
    startMonth: t.month,
    startYear: t.year,
    endDay: end.getUTCDate(),
    endMonth: end.getUTCMonth() + 1,
    endYear: end.getUTCFullYear(),
  };
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
        searchKind: 'cluster',
        scaleMode: 'schematic',
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
        searchKind: 'cluster',
        scaleMode: 'schematic',
        pairA: 'jupiter',
        pairB: 'saturn',
      };
    case 'planetParade':
      return {
        mode: 'alignment',
        ...rangeFromToday(15 * 365),
        alignmentMetric: 'pairwiseSum',
        searchKind: 'cluster',
        scaleMode: 'schematic',
        pairA: 'mars',
        pairB: 'jupiter',
      };
    case 'planetLine':
      return {
        mode: 'alignment',
        ...rangeFromToday(15 * 365),
        alignmentMetric: 'collinear',
        searchKind: 'cluster',
        scaleMode: 'true',
        pairA: 'mars',
        pairB: 'jupiter',
      };
    case 'mercuryVenusClosest':
      return {
        mode: 'alignment',
        ...rangeFromToday(5 * 365),
        alignmentMetric: 'pairwiseSum',
        searchKind: 'pair',
        scaleMode: 'true',
        pairA: 'mercury',
        pairB: 'venus',
      };
  }
}
