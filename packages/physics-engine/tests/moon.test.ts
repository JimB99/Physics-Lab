import { describe, expect, it } from 'vitest';
import { findUpcomingQuarters, getMoonPhase } from '../src/orbital/moon';
import { parseDateParts } from '../src/orbital/dates';

describe('moon phases', () => {
  it('returns a named phase with illumination', () => {
    const info = getMoonPhase(parseDateParts(1, 1, 2024));
    expect(info.name.length).toBeGreaterThan(0);
    expect(info.illuminationFraction).toBeGreaterThanOrEqual(0);
    expect(info.illuminationFraction).toBeLessThanOrEqual(1);
  });

  it('finds upcoming quarters in order', () => {
    const events = findUpcomingQuarters(parseDateParts(1, 1, 2024), 4);
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

  it('matches astronomy-engine illumination at a known full moon', () => {
    const info = getMoonPhase(new Date(Date.UTC(2024, 0, 25, 17, 54)));
    expect(info.name).toBe('Full Moon');
    expect(info.illuminationFraction).toBeGreaterThan(0.99);
  });

  it('reports a near-zero illumination at a known new moon', () => {
    const info = getMoonPhase(new Date(Date.UTC(2024, 0, 11, 11, 57)));
    expect(info.name).toBe('New Moon');
    expect(info.illuminationFraction).toBeLessThan(0.01);
  });

  it('caps the quarter search instead of looping forever', () => {
    const events = findUpcomingQuarters(parseDateParts(1, 1, 2024), 10_000);
    expect(events.length).toBeLessThanOrEqual(400);
  });

  it('returns quarter events with a time of day', () => {
    const events = findUpcomingQuarters(parseDateParts(1, 1, 2024), 2);
    expect(events[0]!.date.getUTCHours() + events[0]!.date.getUTCMinutes()).toBeGreaterThan(0);
  });
});
