export interface TrajectoryXMark {
  x: number;
  kind: 'apex' | 'landing';
}

const NEAR = 1e-6;

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= NEAR * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Apex (max height) and landing range along a projectile sample path. */
export function projectileXMarks(samples: readonly { x: number; y: number }[]): TrajectoryXMark[] {
  if (samples.length === 0) return [];

  let apex = samples[0]!;
  for (const sample of samples) {
    if (sample.y > apex.y) apex = sample;
  }
  const landing = samples[samples.length - 1]!;

  const marks: TrajectoryXMark[] = [];
  if (Number.isFinite(apex.x)) {
    marks.push({ x: apex.x, kind: 'apex' });
  }
  if (Number.isFinite(landing.x) && !nearlyEqual(landing.x, apex.x)) {
    marks.push({ x: landing.x, kind: 'landing' });
  }
  return marks;
}

/** Merge marks from several paths, dropping near-duplicates (fraction of span). */
export function mergeProjectileXMarks(
  series: readonly { samples: readonly { x: number; y: number }[] }[],
  span: number,
): TrajectoryXMark[] {
  const merged: TrajectoryXMark[] = [];
  const tolerance = Math.max(span * 0.02, 1e-3);
  for (const item of series) {
    for (const mark of projectileXMarks(item.samples)) {
      const existing = merged.find((candidate) => Math.abs(candidate.x - mark.x) <= tolerance);
      if (existing) {
        if (existing.kind === 'apex' && mark.kind === 'landing') existing.kind = 'landing';
        continue;
      }
      merged.push({ ...mark });
    }
  }
  merged.sort((a, b) => a.x - b.x);
  return merged;
}
