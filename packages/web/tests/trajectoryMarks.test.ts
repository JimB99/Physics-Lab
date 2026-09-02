import { describe, expect, it } from 'vitest';
import { mergeProjectileXMarks, projectileXMarks } from '../src/lib/trajectoryMarks';

describe('projectileXMarks', () => {
  it('returns apex and landing for a typical arc', () => {
    const samples = [
      { x: 0, y: 0 },
      { x: 5, y: 8 },
      { x: 10, y: 10 },
      { x: 15, y: 8 },
      { x: 20, y: 0 },
    ];
    expect(projectileXMarks(samples)).toEqual([
      { x: 10, kind: 'apex' },
      { x: 20, kind: 'landing' },
    ]);
  });

  it('omits a duplicate landing when it is the apex', () => {
    const samples = [
      { x: 0, y: 0 },
      { x: 4, y: 6 },
    ];
    expect(projectileXMarks(samples)).toEqual([{ x: 4, kind: 'apex' }]);
  });

  it('returns empty for no samples', () => {
    expect(projectileXMarks([])).toEqual([]);
  });
});

describe('mergeProjectileXMarks', () => {
  it('keeps distinct landings from two variants', () => {
    const marks = mergeProjectileXMarks(
      [
        {
          samples: [
            { x: 0, y: 0 },
            { x: 4, y: 5 },
            { x: 8, y: 0 },
          ],
        },
        {
          samples: [
            { x: 0, y: 0 },
            { x: 10, y: 6 },
            { x: 20, y: 0 },
          ],
        },
      ],
      20,
    );
    expect(marks.map((m) => m.kind)).toContain('apex');
    expect(marks.some((m) => m.kind === 'landing' && m.x === 8)).toBe(true);
    expect(marks.some((m) => m.kind === 'landing' && m.x === 20)).toBe(true);
  });
});
