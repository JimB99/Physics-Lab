import { describe, expect, it } from 'vitest';
import { PROJECTILE_PRESETS, VERTICAL_PRESETS } from '../src/lib/scenarioPresets';

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
});
