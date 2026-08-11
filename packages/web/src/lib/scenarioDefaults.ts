import type { CelestialBodyId, ImpactModel } from 'physics-engine';
import type { DragSettings } from '../components/inputs/DragPanel';

export const DEFAULT_DRAG: DragSettings = {
  enabled: false,
  atmospherePreset: 'earthSeaLevel',
  customRho: 1.225,
  shape: 'sphere',
  cd: 0.47,
  area: 0.01,
};

export function parseDragFromParams(params: URLSearchParams): DragSettings {
  return {
    enabled: params.get('drag') === '1',
    atmospherePreset: (params.get('atmosphere') as DragSettings['atmospherePreset']) || 'earthSeaLevel',
    customRho: parseFloat(params.get('rho') || '1.225'),
    shape: (params.get('shape') as DragSettings['shape']) || 'sphere',
    cd: parseFloat(params.get('cd') || '0.47'),
    area: parseFloat(params.get('area') || '0.01'),
  };
}

export function parseImpactFromParams(params: URLSearchParams) {
  return {
    enabled: params.get('impact') === '1',
    model: (params.get('impactModel') as ImpactModel) || 'stoppingTime',
    stoppingTime: parseFloat(params.get('stoppingTime') || '0.01'),
    stoppingDistance: parseFloat(params.get('stoppingDistance') || '0.05'),
    contactArea: parseFloat(params.get('contactArea') || '0'),
  };
}

export type { CelestialBodyId };
