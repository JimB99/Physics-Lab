import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ImpactModel } from 'physics-engine';

export interface ImpactSettings {
  enabled: boolean;
  model: ImpactModel;
  stoppingTime: number;
  stoppingDistance: number;
  contactArea: number;
}

const DEFAULTS: ImpactSettings = {
  enabled: false,
  model: 'stoppingTime',
  stoppingTime: 0.01,
  stoppingDistance: 0.05,
  contactArea: 0,
};

function parseFloatParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useImpactSettings(): [ImpactSettings, (patch: Partial<ImpactSettings>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const settings = useMemo<ImpactSettings>(
    () => ({
      enabled: searchParams.get('impact') === '1',
      model: searchParams.get('impactModel') === 'stoppingDistance' ? 'stoppingDistance' : 'stoppingTime',
      stoppingTime: parseFloatParam(searchParams.get('stoppingTime'), DEFAULTS.stoppingTime),
      stoppingDistance: parseFloatParam(searchParams.get('stoppingDistance'), DEFAULTS.stoppingDistance),
      contactArea: parseFloatParam(searchParams.get('contactArea'), DEFAULTS.contactArea),
    }),
    [searchParams],
  );

  const setSettings = useCallback(
    (patch: Partial<ImpactSettings>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (patch.enabled !== undefined) params.set('impact', patch.enabled ? '1' : '0');
          if (patch.model !== undefined) params.set('impactModel', patch.model);
          if (patch.stoppingTime !== undefined) params.set('stoppingTime', String(patch.stoppingTime));
          if (patch.stoppingDistance !== undefined) {
            params.set('stoppingDistance', String(patch.stoppingDistance));
          }
          if (patch.contactArea !== undefined) params.set('contactArea', String(patch.contactArea));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [settings, setSettings];
}
