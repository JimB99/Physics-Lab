export interface MoonDiskGeometry {
  phaseAngleDeg: number;
  litOnRight: boolean;
  gibbous: boolean;
  terminatorAxisRatio: number;
  illuminatedFraction: number;
}

/**
 * Geometry for drawing a lunar disk. The terminator is the projection of the
 * day/night great circle, which is a half-ellipse with semi-minor axis
 * r·|cos φ| and semi-major axis r.
 */
export function moonDiskGeometry(phaseAngleDeg: number): MoonDiskGeometry {
  const phase = ((phaseAngleDeg % 360) + 360) % 360;
  const rad = (phase * Math.PI) / 180;
  const cos = Math.cos(rad);
  return {
    phaseAngleDeg: phase,
    litOnRight: phase < 180,
    gibbous: phase > 90 && phase < 270,
    terminatorAxisRatio: Math.abs(cos),
    illuminatedFraction: (1 - cos) / 2,
  };
}
