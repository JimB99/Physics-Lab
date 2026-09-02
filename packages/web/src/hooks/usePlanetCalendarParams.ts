import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ORBITAL_PLANETS } from 'physics-engine';
import type { AlignmentMetric, AlignmentSearchKind, DisplayScaleMode, OrbitalPlanetId } from 'physics-engine';

export type PlanetCalendarMode = 'snapshot' | 'alignment' | 'animate';

export interface PlanetCalendarParams {
  mode: PlanetCalendarMode;
  day: number;
  month: number;
  year: number;
  startDay: number;
  startMonth: number;
  startYear: number;
  endDay: number;
  endMonth: number;
  endYear: number;
  stepDays: number;
  scaleMode: DisplayScaleMode;
  alignmentMetric: AlignmentMetric;
  searchKind: AlignmentSearchKind;
  pairA: OrbitalPlanetId;
  pairB: OrbitalPlanetId;
}

const today = new Date();

const defaults: PlanetCalendarParams = {
  mode: 'snapshot',
  day: today.getUTCDate(),
  month: today.getUTCMonth() + 1,
  year: today.getUTCFullYear(),
  startDay: 1,
  startMonth: 1,
  startYear: today.getUTCFullYear(),
  endDay: 31,
  endMonth: 12,
  endYear: today.getUTCFullYear(),
  stepDays: 1,
  scaleMode: 'schematic',
  alignmentMetric: 'pairwiseSum',
  searchKind: 'cluster',
  pairA: 'mars',
  pairB: 'jupiter',
};

export const PLANET_CALENDAR_PARAM_KEYS: Record<keyof PlanetCalendarParams, string> = {
  mode: 'mode',
  day: 'day',
  month: 'month',
  year: 'year',
  startDay: 'startDay',
  startMonth: 'startMonth',
  startYear: 'startYear',
  endDay: 'endDay',
  endMonth: 'endMonth',
  endYear: 'endYear',
  stepDays: 'stepDays',
  scaleMode: 'scale',
  alignmentMetric: 'metric',
  searchKind: 'search',
  pairA: 'pairA',
  pairB: 'pairB',
};

const ORBITAL_PLANET_IDS = new Set<string>(ORBITAL_PLANETS.map((p) => p.id));

function parseIntParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePlanetParam(value: string | null, fallback: OrbitalPlanetId): OrbitalPlanetId {
  return value !== null && ORBITAL_PLANET_IDS.has(value) ? (value as OrbitalPlanetId) : fallback;
}

export function usePlanetCalendarParams(): [PlanetCalendarParams, (patch: Partial<PlanetCalendarParams>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo((): PlanetCalendarParams => {
    const keys = PLANET_CALENDAR_PARAM_KEYS;
    const modeParam = searchParams.get(keys.mode);
    const mode: PlanetCalendarMode =
      modeParam === 'alignment' || modeParam === 'animate' ? modeParam : 'snapshot';
    const scaleParam = searchParams.get(keys.scaleMode);
    const scaleMode: DisplayScaleMode =
      scaleParam === 'true' || scaleParam === 'log' ? scaleParam : 'schematic';
    const metricParam = searchParams.get(keys.alignmentMetric);
    const alignmentMetric: AlignmentMetric =
      metricParam === 'maxPairwise' ||
      metricParam === 'chainByLongitude' ||
      metricParam === 'collinear' ||
      metricParam === 'syzygy'
        ? metricParam
        : 'pairwiseSum';
    const searchParam = searchParams.get(keys.searchKind);
    const searchKind: AlignmentSearchKind = searchParam === 'pair' ? 'pair' : 'cluster';

    return {
      mode,
      day: parseIntParam(searchParams.get(keys.day), defaults.day),
      month: parseIntParam(searchParams.get(keys.month), defaults.month),
      year: parseIntParam(searchParams.get(keys.year), defaults.year),
      startDay: parseIntParam(searchParams.get(keys.startDay), defaults.startDay),
      startMonth: parseIntParam(searchParams.get(keys.startMonth), defaults.startMonth),
      startYear: parseIntParam(searchParams.get(keys.startYear), defaults.startYear),
      endDay: parseIntParam(searchParams.get(keys.endDay), defaults.endDay),
      endMonth: parseIntParam(searchParams.get(keys.endMonth), defaults.endMonth),
      endYear: parseIntParam(searchParams.get(keys.endYear), defaults.endYear),
      stepDays: Math.max(1, parseIntParam(searchParams.get(keys.stepDays), defaults.stepDays)),
      scaleMode,
      alignmentMetric,
      searchKind,
      pairA: parsePlanetParam(searchParams.get(keys.pairA), defaults.pairA),
      pairB: parsePlanetParam(searchParams.get(keys.pairB), defaults.pairB),
    };
  }, [searchParams]);

  const setParams = useCallback(
    (patch: Partial<PlanetCalendarParams>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const paramKey = PLANET_CALENDAR_PARAM_KEYS[key as keyof PlanetCalendarParams];
            if (!paramKey) continue;
            next.set(paramKey, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [params, setParams];
}

export function buildPlanetCalendarLink(options: {
  highlight?: OrbitalPlanetId;
  date?: Date;
}): string {
  const date = options.date ?? new Date();
  const params = new URLSearchParams({
    day: String(date.getUTCDate()),
    month: String(date.getUTCMonth() + 1),
    year: String(date.getUTCFullYear()),
    mode: 'snapshot',
  });
  if (options.highlight) params.set('highlight', options.highlight);
  return `/solar-system/planet-calendar?${params.toString()}`;
}
