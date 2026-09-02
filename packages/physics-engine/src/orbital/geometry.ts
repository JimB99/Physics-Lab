export interface PlanePoint {
  xAu: number;
  yAu: number;
}

export interface FitLine2d {
  originX: number;
  originY: number;
  directionX: number;
  directionY: number;
}

export function bestFitLine2d(points: readonly PlanePoint[]): FitLine2d | null {
  if (points.length < 2) return null;

  let mx = 0;
  let my = 0;
  for (const p of points) {
    mx += p.xAu;
    my += p.yAu;
  }
  mx /= points.length;
  my /= points.length;

  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const p of points) {
    const dx = p.xAu - mx;
    const dy = p.yAu - my;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }

  const theta = 0.5 * Math.atan2(2 * xy, xx - yy);
  let directionX = Math.cos(theta);
  let directionY = Math.sin(theta);
  const length = Math.hypot(directionX, directionY);
  if (length === 0) return { originX: mx, originY: my, directionX: 1, directionY: 0 };
  directionX /= length;
  directionY /= length;

  return { originX: mx, originY: my, directionX, directionY };
}

export function collinearRmsAu(points: readonly PlanePoint[]): number {
  if (points.length < 3) return 0;
  const line = bestFitLine2d(points);
  if (!line) return 0;

  let sumSq = 0;
  for (const p of points) {
    const dx = p.xAu - line.originX;
    const dy = p.yAu - line.originY;
    const dist = Math.abs(dx * line.directionY - dy * line.directionX);
    sumSq += dist * dist;
  }
  return Math.sqrt(sumSq / points.length);
}

function wrap180(deg: number): number {
  const wrapped = ((deg + 180) % 360 + 360) % 360 - 180;
  return wrapped;
}

export function circularMeanDeg(longitudesDeg: readonly number[]): number {
  if (longitudesDeg.length === 0) return 0;
  let sin = 0;
  let cos = 0;
  for (const lon of longitudesDeg) {
    const rad = (lon * Math.PI) / 180;
    sin += Math.sin(rad);
    cos += Math.cos(rad);
  }
  return ((Math.atan2(sin, cos) * 180) / Math.PI + 360) % 360;
}

export function radialRmsDeg(longitudesDeg: readonly number[]): number {
  if (longitudesDeg.length === 0) return 0;
  const mean = circularMeanDeg(longitudesDeg);
  let sumSq = 0;
  for (const lon of longitudesDeg) {
    const delta = wrap180(lon - mean);
    sumSq += delta * delta;
  }
  return Math.sqrt(sumSq / longitudesDeg.length);
}

function angularSeparationDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** RMS angular distance to the best-fit axis through the origin (conjunction or opposition). */
export function syzygyRmsDeg(longitudesDeg: readonly number[]): number {
  if (longitudesDeg.length === 0) return 0;
  let sin = 0;
  let cos = 0;
  for (const lon of longitudesDeg) {
    const rad = (2 * lon * Math.PI) / 180;
    sin += Math.sin(rad);
    cos += Math.cos(rad);
  }
  const axisDeg = ((Math.atan2(sin, cos) * 180) / Math.PI) / 2;
  let sumSq = 0;
  for (const lon of longitudesDeg) {
    const d = angularSeparationDeg(lon, axisDeg);
    const toLine = Math.min(d, 180 - d);
    sumSq += toLine * toLine;
  }
  return Math.sqrt(sumSq / longitudesDeg.length);
}

export function syzygyAxisDeg(longitudesDeg: readonly number[]): number {
  if (longitudesDeg.length === 0) return 0;
  let sin = 0;
  let cos = 0;
  for (const lon of longitudesDeg) {
    const rad = (2 * lon * Math.PI) / 180;
    sin += Math.sin(rad);
    cos += Math.cos(rad);
  }
  return ((Math.atan2(sin, cos) * 180) / Math.PI) / 2;
}
