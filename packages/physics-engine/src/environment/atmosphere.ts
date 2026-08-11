import type { Atmosphere, AtmospherePresetId } from '../types';

export const ATMOSPHERE_PRESETS: Record<Exclude<AtmospherePresetId, 'custom'>, { rho: number; label: string }> = {
  earthSeaLevel: { rho: 1.225, label: 'Earth sea level' },
  marsThin: { rho: 0.02, label: 'Mars (thin atmosphere)' },
  moonVacuum: { rho: 0, label: 'Moon (vacuum)' },
};

export function resolveAtmosphere(preset: AtmospherePresetId, customRho?: number, enabled = true): Atmosphere {
  if (preset === 'custom') {
    return { enabled, rho: customRho ?? 1.225, preset };
  }
  const p = ATMOSPHERE_PRESETS[preset];
  return { enabled: enabled && p.rho > 0, rho: p.rho, preset };
}
