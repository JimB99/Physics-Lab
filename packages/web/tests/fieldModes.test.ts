import { describe, expect, it } from 'vitest';
import {
  PROJECTILE_DEFAULT_MODES,
  PROJECTILE_FIELD_IDS,
  VERTICAL_DEFAULT_MODES,
  VERTICAL_FIELD_IDS,
  parseUrlFieldModes,
  resolveFieldModes,
} from '../src/lib/fieldModes';
import { PROJECTILE_PRESETS, VERTICAL_PRESETS } from '../src/lib/scenarioPresets';

describe('parseUrlFieldModes', () => {
  it('ignores keys that are not *_mode', () => {
    const modes = parseUrlFieldModes(new URLSearchParams('h0=330&h0_mode=given&planet=earth'));
    expect(modes).toEqual({ h0: 'given' });
  });

  it('does not invent Given for unspecified fields', () => {
    const modes = parseUrlFieldModes(new URLSearchParams('h0=10'));
    expect(modes.t).toBeUndefined();
    expect(modes.y).toBeUndefined();
    expect(Object.keys(modes)).toHaveLength(0);
  });
});

describe('resolveFieldModes', () => {
  it('keeps solve defaults when the URL omits a field', () => {
    const modes = resolveFieldModes(VERTICAL_DEFAULT_MODES, parseUrlFieldModes(new URLSearchParams('h0_mode=given')));
    expect(modes.h0).toBe('given');
    expect(modes.y).toBe('solve');
    expect(modes.impactTime).toBe('solve');
  });

  it('lets the URL mark an extra field as given', () => {
    const modes = resolveFieldModes(
      VERTICAL_DEFAULT_MODES,
      parseUrlFieldModes(new URLSearchParams('y_mode=given')),
    );
    expect(modes.y).toBe('given');
    expect(modes.v0).toBe('given');
  });
});

describe('scenario presets vs default modes', () => {
  it('does not treat unspecified vertical fields as Given', () => {
    for (const preset of VERTICAL_PRESETS) {
      const modes = resolveFieldModes(VERTICAL_DEFAULT_MODES, parseUrlFieldModes(new URLSearchParams(preset.query)));
      for (const id of VERTICAL_FIELD_IDS) {
        if (!new URLSearchParams(preset.query).has(`${id}_mode`)) {
          expect(modes[id], `${preset.id} ${id}`).toBe(VERTICAL_DEFAULT_MODES[id]);
        }
      }
      const givenExtras = VERTICAL_FIELD_IDS.filter(
        (id) => modes[id] === 'given' && id !== 'h0' && id !== 'v0',
      );
      expect(givenExtras, `${preset.id} extra givens`).toEqual([]);
    }
  });

  it('does not treat unspecified projectile fields as Given except launch params', () => {
    for (const preset of PROJECTILE_PRESETS) {
      const modes = resolveFieldModes(
        PROJECTILE_DEFAULT_MODES,
        parseUrlFieldModes(new URLSearchParams(preset.query)),
      );
      const given = PROJECTILE_FIELD_IDS.filter((id) => modes[id] === 'given');
      const allowed = new Set(['h0', 'v0', 'angle', 'range']);
      for (const id of given) {
        expect(allowed.has(id), `${preset.id} unexpectedly given ${id}`).toBe(true);
      }
    }
  });
});
