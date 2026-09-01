export function formatNumber(value: number, decimals = 3): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.001 || abs >= 1e6)) {
    return value.toExponential(decimals);
  }
  return value.toFixed(decimals);
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
