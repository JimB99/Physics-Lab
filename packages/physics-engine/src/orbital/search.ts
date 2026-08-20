const COARSE_SAMPLES = 80;
const MAX_BASINS = 5;
const GOLDEN_ITERATIONS = 30;
const PHI = (1 + Math.sqrt(5)) / 2;

export interface MinimizeResult {
  date: Date;
  score: number;
}

function msToDate(ms: number): Date {
  return new Date(ms);
}

function goldenSectionMinimize(
  startMs: number,
  endMs: number,
  fn: (date: Date) => number,
): MinimizeResult {
  let a = startMs;
  let b = endMs;
  let c = b - (b - a) / PHI;
  let d = a + (b - a) / PHI;
  let fc = fn(msToDate(c));
  let fd = fn(msToDate(d));

  for (let i = 0; i < GOLDEN_ITERATIONS; i++) {
    if (fc <= fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - (b - a) / PHI;
      fc = fn(msToDate(c));
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + (b - a) / PHI;
      fd = fn(msToDate(d));
    }
  }

  const midMs = (a + b) / 2;
  const midDate = msToDate(midMs);
  return { date: midDate, score: fn(midDate) };
}

/**
 * Fixed-budget minimizer on a date interval. Cost is independent of calendar span.
 */
export function minimizeOnInterval(
  start: Date,
  endExclusive: Date,
  fn: (date: Date) => number,
): MinimizeResult | null {
  const startMs = start.getTime();
  const endMs = endExclusive.getTime();
  if (endMs <= startMs) return null;

  const span = endMs - startMs;
  const coarse: MinimizeResult[] = [];

  for (let i = 0; i < COARSE_SAMPLES; i++) {
    const t = startMs + (span * i) / Math.max(COARSE_SAMPLES - 1, 1);
    const date = msToDate(t);
    coarse.push({ date, score: fn(date) });
  }

  const basinIndices = new Set<number>();
  for (let i = 0; i < coarse.length; i++) {
    const prev = coarse[i - 1]?.score ?? Number.POSITIVE_INFINITY;
    const curr = coarse[i]!.score;
    const next = coarse[i + 1]?.score ?? Number.POSITIVE_INFINITY;
    if (curr <= prev && curr <= next) {
      basinIndices.add(i);
    }
  }

  if (basinIndices.size === 0) {
    let best = coarse[0]!;
    for (const sample of coarse) {
      if (sample.score < best.score) best = sample;
    }
    return best;
  }

  const sortedBasins = [...basinIndices]
    .map((index) => ({ index, score: coarse[index]!.score }))
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_BASINS);

  let best: MinimizeResult | null = null;
  const step = span / Math.max(COARSE_SAMPLES - 1, 1);

  for (const basin of sortedBasins) {
    const left = Math.max(startMs, startMs + (basin.index - 1) * step);
    const right = Math.min(endMs, startMs + (basin.index + 1) * step);
    const refined = goldenSectionMinimize(left, right, fn);
    if (!best || refined.score < best.score) {
      best = refined;
    }
  }

  return best;
}
