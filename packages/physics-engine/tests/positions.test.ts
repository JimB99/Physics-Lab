import { describe, expect, it } from 'vitest';
import { getSolarSystemSnapshot } from '../src/orbital/positions';
import { parseDateParts } from '../src/orbital/dates';

const date = parseDateParts(1, 1, 2024);

describe('display scale modes', () => {
  it('true mode uses AU radii', () => {
    const snapshot = getSolarSystemSnapshot(date, 'true');
    const neptune = snapshot.positions.find((p) => p.id === 'neptune')!;
    expect(neptune.orbitDisplayRadius).toBeCloseTo(neptune.distanceAu, 6);
  });

  it('schematic mode uses fixed radii', () => {
    const snapshot = getSolarSystemSnapshot(date, 'schematic');
    expect(snapshot.positions.find((p) => p.id === 'mars')!.orbitDisplayRadius).toBe(8);
  });

  it('log mode compresses the outer planets but keeps the ordering', () => {
    const snapshot = getSolarSystemSnapshot(date, 'log');
    const radii = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].map(
      (id) => snapshot.positions.find((p) => p.id === id)!.orbitDisplayRadius,
    );
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]!).toBeGreaterThan(radii[i - 1]!);
    }
    expect(radii[7]! / radii[0]!).toBeLessThan(6);
  });

  it('log mode keeps the display angle equal to the ecliptic longitude', () => {
    const snapshot = getSolarSystemSnapshot(date, 'log');
    const earth = snapshot.positions.find((p) => p.id === 'earth')!;
    const angle = (Math.atan2(earth.displayY, earth.displayX) * 180) / Math.PI;
    const expected = ((earth.longitudeDeg + 180) % 360) - 180;
    expect(angle).toBeCloseTo(expected, 4);
  });
});
