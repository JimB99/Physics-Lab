import type { ShapePresetId } from '../types';

export interface ShapePreset {
  id: ShapePresetId;
  label: string;
  cd: number;
  note: string;
}

export const SHAPE_PRESETS: ShapePreset[] = [
  { id: 'sphere', label: 'Sphere', cd: 0.47, note: 'Smooth sphere' },
  { id: 'cube', label: 'Cube', cd: 0.8, note: 'Approximate' },
  { id: 'cylinder', label: 'Cylinder', cd: 0.82, note: 'Broad side to flow' },
  { id: 'flatPlate', label: 'Flat plate', cd: 1.28, note: 'Perpendicular to flow' },
  { id: 'custom', label: 'Custom', cd: 1.0, note: 'Manual Cd override' },
];
