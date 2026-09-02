import type { FieldMode } from '../components/inputs/SolvableField';

export const VERTICAL_FIELD_IDS = [
  'h0',
  'v0',
  't',
  'y',
  'v',
  'impactTime',
  'impactVelocity',
  'maxHeight',
  'timeToMaxHeight',
] as const;

export const PROJECTILE_FIELD_IDS = [
  'h0',
  'v0',
  'angle',
  'vx',
  'vy',
  't',
  'x',
  'y',
  'v',
  'range',
  'flightTime',
  'maxHeight',
  'impactVelocity',
  'impactAngle',
  'timeToMaxHeight',
] as const;

export const VERTICAL_DEFAULT_MODES: Record<(typeof VERTICAL_FIELD_IDS)[number], FieldMode> = {
  h0: 'given',
  v0: 'given',
  t: 'solve',
  y: 'solve',
  v: 'solve',
  impactTime: 'solve',
  impactVelocity: 'solve',
  maxHeight: 'solve',
  timeToMaxHeight: 'solve',
};

export const PROJECTILE_DEFAULT_MODES: Record<(typeof PROJECTILE_FIELD_IDS)[number], FieldMode> = {
  h0: 'given',
  v0: 'given',
  angle: 'given',
  vx: 'solve',
  vy: 'solve',
  t: 'solve',
  x: 'solve',
  y: 'solve',
  v: 'solve',
  range: 'solve',
  flightTime: 'solve',
  maxHeight: 'solve',
  impactVelocity: 'solve',
  impactAngle: 'solve',
  timeToMaxHeight: 'solve',
};

export function parseUrlFieldModes(searchParams: URLSearchParams): Record<string, FieldMode> {
  const result: Record<string, FieldMode> = {};
  for (const [key, value] of searchParams) {
    if (!key.endsWith('_mode')) continue;
    if (value !== 'given' && value !== 'solve') continue;
    result[key.slice(0, -5)] = value;
  }
  return result;
}

export function resolveFieldModes(
  defaults: Record<string, FieldMode>,
  urlModes: Partial<Record<string, FieldMode>>,
): Record<string, FieldMode> {
  const result = { ...defaults };
  for (const [key, mode] of Object.entries(urlModes)) {
    if (key in result && (mode === 'given' || mode === 'solve')) {
      result[key] = mode;
    }
  }
  return result;
}

export function withExplicitModes(
  query: string,
  fieldIds: readonly string[],
  defaults: Record<string, FieldMode>,
): string {
  const params = new URLSearchParams(query);
  for (const id of fieldIds) {
    if (!params.has(`${id}_mode`)) {
      params.set(`${id}_mode`, defaults[id] ?? 'solve');
    }
  }
  return params.toString();
}
