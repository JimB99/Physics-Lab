import type { CelestialBodyId } from 'physics-engine';
import type { DragSettings } from '../components/inputs/DragPanel';

export const DEFAULT_DRAG: DragSettings = {
  enabled: false,
  atmospherePreset: 'earthSeaLevel',
  customRho: 1.225,
  shape: 'sphere',
  cd: 0.47,
  area: 0.01,
};

export type { CelestialBodyId };
