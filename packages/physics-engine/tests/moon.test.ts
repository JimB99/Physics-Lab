import { describe, expect, it } from 'vitest';
import { findUpcomingPhases, findUpcomingQuarters, getMoonPhase } from '../src/orbital/moon';
import { parseDateParts } from '../src/orbital/dates';

describe('moon phases', () => {
  it('returns a named phase with illumination', () => {
    const info = getMoonPhase(parseDateParts(1, 1, 2024));
    expect(info.name.length).toBeGreaterThan(0);
    expect(info.illuminationFraction).toBeGreaterThanOrEqual(0);
    expect(info.illuminationFraction).toBeLessThanOrEqual(1);
  });

  it('finds upcoming major phases in order', () => {
    const start = parseDateParts(1, 1, 2024);
    const events = findUpcomingPhases(start, 4);
    expect(events.length).toBe(4);
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.date.getTime()).toBeGreaterThan(events[i - 1]!.date.getTime());
    }
  });

  it('finds upcoming quarters', () => {
    const start = parseDateParts(1, 1, 2024);
    const events = findUpcomingQuarters(start, 4);
    expect(events.length).toBeGreaterThan(0);
  });
});
