export function impactPressure(force: number, area: number): number {
  if (area <= 0) throw new Error('Contact area must be positive');
  return force / area;
}
