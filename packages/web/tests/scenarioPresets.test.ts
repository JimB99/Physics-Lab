import { describe, expect, it } from 'vitest';
import { solveProjectile, solveVertical1D } from 'physics-engine';
import { PROJECTILE_PRESETS, VERTICAL_PRESETS } from '../src/lib/scenarioPresets';
import {
  PROJECTILE_DEFAULT_MODES,
  PROJECTILE_FIELD_IDS,
  VERTICAL_DEFAULT_MODES,
  VERTICAL_FIELD_IDS,
  parseUrlFieldModes,
  resolveFieldModes,
} from '../src/lib/fieldModes';

describe('scenario presets', () => {
  it('has unique ids', () => {
    const ids = [...VERTICAL_PRESETS, ...PROJECTILE_PRESETS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('produces parseable query strings with no leading question mark', () => {
    for (const preset of [...VERTICAL_PRESETS, ...PROJECTILE_PRESETS]) {
      expect(preset.query.startsWith('?')).toBe(false);
      const params = new URLSearchParams(preset.query);
      expect([...params.keys()].length).toBeGreaterThan(0);
    }
  });

  it('only sets modes to given or solve', () => {
    for (const preset of [...VERTICAL_PRESETS, ...PROJECTILE_PRESETS]) {
      const params = new URLSearchParams(preset.query);
      for (const [key, value] of params) {
        if (key.endsWith('_mode')) expect(['given', 'solve']).toContain(value);
      }
    }
  });

  it('vacuum vertical examples are solvable', () => {
    const earth = { planet: 'earth' as const, g: 9.80665, mass: 1 };
    const moon = { planet: 'moon' as const, g: 1.62, mass: 1 };
    const jupiter = { planet: 'jupiter' as const, g: 24.79, mass: 1 };
    const envs = { eiffel: earth, moonHammer: moon, jupiterDrop: jupiter, throwUp: earth, throwDown: earth };

    for (const preset of VERTICAL_PRESETS.filter((p) => !p.query.includes('drag=1'))) {
      const params = new URLSearchParams(preset.query);
      const modes = resolveFieldModes(VERTICAL_DEFAULT_MODES, parseUrlFieldModes(params));
      const specs = VERTICAL_FIELD_IDS.map((id) => ({
        id,
        mode: modes[id]!,
        value: modes[id] === 'given' ? Number(params.get(id) ?? 0) : undefined,
      }));
      const env = envs[preset.id as keyof typeof envs] ?? earth;
      const result = solveVertical1D(specs, env);
      expect(result.status, `${preset.id} ${result.status === 'overconstrained' ? result.conflicts.join('; ') : ''}`).toBe('solved');
    }
  });

  it('vacuum projectile examples are solvable', () => {
    const earth = { planet: 'earth' as const, g: 9.80665, mass: 1 };
    for (const preset of PROJECTILE_PRESETS.filter((p) => !p.query.includes('drag=1'))) {
      const params = new URLSearchParams(preset.query);
      const modes = resolveFieldModes(PROJECTILE_DEFAULT_MODES, parseUrlFieldModes(params));
      const specs = PROJECTILE_FIELD_IDS.map((id) => ({
        id,
        mode: modes[id]!,
        value: modes[id] === 'given' ? Number(params.get(id) ?? 0) : undefined,
      }));
      const result = solveProjectile(specs, earth);
      expect(result.status, `${preset.id}`).toBe('solved');
    }
  });
});
