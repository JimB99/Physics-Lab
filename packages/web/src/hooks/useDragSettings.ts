import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DragSettings } from '../components/inputs/DragPanel';
import { DEFAULT_DRAG } from '../lib/scenarioDefaults';

function parseFloatParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useDragSettings(): [DragSettings, (next: DragSettings) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const settings = useMemo<DragSettings>(
    () => ({
      enabled: searchParams.get('drag') === '1',
      atmospherePreset:
        (searchParams.get('atmosphere') as DragSettings['atmospherePreset']) ||
        DEFAULT_DRAG.atmospherePreset,
      customRho: parseFloatParam(searchParams.get('rho'), DEFAULT_DRAG.customRho),
      shape: (searchParams.get('shape') as DragSettings['shape']) || DEFAULT_DRAG.shape,
      cd: parseFloatParam(searchParams.get('cd'), DEFAULT_DRAG.cd),
      area: parseFloatParam(searchParams.get('area'), DEFAULT_DRAG.area),
    }),
    [searchParams],
  );

  const setSettings = useCallback(
    (next: DragSettings) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('drag', next.enabled ? '1' : '0');
          params.set('atmosphere', next.atmospherePreset);
          params.set('rho', String(next.customRho));
          params.set('shape', next.shape);
          params.set('cd', String(next.cd));
          params.set('area', String(next.area));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [settings, setSettings];
}
