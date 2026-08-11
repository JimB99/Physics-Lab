import type { CelestialBodyId } from 'physics-engine';
import { CELESTIAL_BODIES } from 'physics-engine';

export type CompareScenario = 'vertical1d' | 'projectile';
export type CompareType = 'environment' | 'drag' | 'angle';

export interface VariantConfig {
  id: string;
  label: string;
  color: string;
  planet: CelestialBodyId;
  customG: number;
  h0: number;
  v0: number;
  angle: number;
  dragEnabled: boolean;
}

export const COMPARE_COLORS = ['#4da3ff', '#3dd68c', '#f0b429'];

export const DEFAULT_VARIANTS: VariantConfig[] = [
  { id: 'a', label: 'Variant A', color: COMPARE_COLORS[0]!, planet: 'earth', customG: 9.80665, h0: 10, v0: 0, angle: 45, dragEnabled: false },
  { id: 'b', label: 'Variant B', color: COMPARE_COLORS[1]!, planet: 'moon', customG: 1.62, h0: 10, v0: 0, angle: 45, dragEnabled: false },
];

export function planetLabel(id: CelestialBodyId): string {
  return CELESTIAL_BODIES.find((b) => b.id === id)?.name ?? id;
}
