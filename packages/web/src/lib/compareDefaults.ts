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
  if (id === 'custom') return 'Custom g';
  return CELESTIAL_BODIES.find((b) => b.id === id)?.name ?? id;
}

const VARIANT_IDS = ['a', 'b', 'c'] as const;
const VALID_BODY_IDS = new Set<string>([...CELESTIAL_BODIES.map((b) => b.id), 'custom']);

export function encodeVariant(v: VariantConfig): string {
  return [v.planet, v.customG, v.h0, v.v0, v.angle, v.dragEnabled ? 1 : 0].join(':');
}

export function decodeVariant(id: string, raw: string, color: string): VariantConfig | null {
  const parts = raw.split(':');
  if (parts.length !== 6) return null;
  const [planet, customG, h0, v0, angle, drag] = parts as [string, string, string, string, string, string];
  if (!VALID_BODY_IDS.has(planet)) return null;
  const numbers = [customG, h0, v0, angle].map(Number);
  if (numbers.some((n) => !Number.isFinite(n))) return null;
  return {
    id,
    label: `Variant ${id.toUpperCase()}`,
    color,
    planet: planet as CelestialBodyId,
    customG: numbers[0]!,
    h0: numbers[1]!,
    v0: numbers[2]!,
    angle: numbers[3]!,
    dragEnabled: drag === '1',
  };
}

export function nextVariantId(existing: VariantConfig[]): string {
  const used = new Set(existing.map((v) => v.id));
  return VARIANT_IDS.find((candidate) => !used.has(candidate)) ?? 'c';
}

export function variantColor(index: number): string {
  return COMPARE_COLORS[index % COMPARE_COLORS.length]!;
}
