import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AlignmentMetric, DisplayScaleMode, OrbitalPlanetId } from 'physics-engine';

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
  pairA: 'mars',
  pairB: 'jupiter',
};

function parseIntParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function usePlanetCalendarParams(): [PlanetCalendarParams, (patch: Partial<PlanetCalendarParams>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo((): PlanetCalendarParams => {
    const modeParam = searchParams.get('mode');
    const mode: PlanetCalendarMode =
      modeParam === 'alignment' || modeParam === 'animate' ? modeParam : 'snapshot';
    const scaleParam = searchParams.get('scale');
    const scaleMode: DisplayScaleMode = scaleParam === 'true' ? 'true' : 'schematic';
    const metricParam = searchParams.get('metric');
    const alignmentMetric: AlignmentMetric =
      metricParam === 'maxPairwise' || metricParam === 'chainByLongitude' ? metricParam : 'pairwiseSum';

    return {
      mode,
      day: parseIntParam(searchParams.get('day'), defaults.day),
      month: parseIntParam(searchParams.get('month'), defaults.month),
      year: parseIntParam(searchParams.get('year'), defaults.year),
      startDay: parseIntParam(searchParams.get('startDay'), defaults.startDay),
      startMonth: parseIntParam(searchParams.get('startMonth'), defaults.startMonth),
      startYear: parseIntParam(searchParams.get('startYear'), defaults.startYear),
      endDay: parseIntParam(searchParams.get('endDay'), defaults.endDay),
      endMonth: parseIntParam(searchParams.get('endMonth'), defaults.endMonth),
      endYear: parseIntParam(searchParams.get('endYear'), defaults.endYear),
      stepDays: Math.max(1, parseIntParam(searchParams.get('stepDays'), defaults.stepDays)),
      scaleMode,
      alignmentMetric,
      pairA: (searchParams.get('pairA') as OrbitalPlanetId) || defaults.pairA,
      pairB: (searchParams.get('pairB') as OrbitalPlanetId) || defaults.pairB,
    };
  }, [searchParams]);

  const setParams = useCallback(
    (patch: Partial<PlanetCalendarParams>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            next.set(key, String(value));
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
