const DEFAULT_MAX_SAMPLE_DAYS = 5;
const DEFAULT_MAX_COARSE_SAMPLES = 4000;
const MIN_COARSE_SAMPLES = 64;
const DEFAULT_MAX_BASINS = 8;
const GOLDEN_ITERATIONS = 40;
const PHI = (1 + Math.sqrt(5)) / 2;
const MS_PER_DAY = 86_400_000;

export interface MinimizeResult {
  date: Date;
  score: number;
}

export interface MinimizeOptions {
  maxSampleDays?: number;
  maxCoarseSamples?: number;
  maxBasins?: number;
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

  const candidates: MinimizeResult[] = [
    { date: msToDate(a), score: fn(msToDate(a)) },
    { date: msToDate((a + b) / 2), score: fn(msToDate((a + b) / 2)) },
    { date: msToDate(b), score: fn(msToDate(b)) },
  ];
  return candidates.reduce((best, candidate) => (candidate.score < best.score ? candidate : best));
}

export function minimizeOnInterval(
  start: Date,
  endExclusive: Date,
  fn: (date: Date) => number,
  options: MinimizeOptions = {},
): MinimizeResult | null {
  const startMs = start.getTime();
  const endMs = endExclusive.getTime();
  if (endMs <= startMs) return null;

  const maxSampleDays = options.maxSampleDays ?? DEFAULT_MAX_SAMPLE_DAYS;
  const maxCoarseSamples = options.maxCoarseSamples ?? DEFAULT_MAX_COARSE_SAMPLES;
  const maxBasins = options.maxBasins ?? DEFAULT_MAX_BASINS;

  const span = endMs - startMs;
  const spanDays = span / MS_PER_DAY;
  const coarseSamples = Math.min(
    maxCoarseSamples,
    Math.max(MIN_COARSE_SAMPLES, Math.ceil(spanDays / maxSampleDays) + 1),
  );

  const scores = new Float64Array(coarseSamples);
  const divisor = Math.max(coarseSamples - 1, 1);
  for (let i = 0; i < coarseSamples; i++) {
    scores[i] = fn(msToDate(startMs + (span * i) / divisor));
  }

  const basins: { index: number; score: number }[] = [];
  for (let i = 0; i < coarseSamples; i++) {
    const prev = i > 0 ? scores[i - 1]! : Number.POSITIVE_INFINITY;
    const curr = scores[i]!;
    const next = i < coarseSamples - 1 ? scores[i + 1]! : Number.POSITIVE_INFINITY;
    if (curr <= prev && curr <= next) basins.push({ index: i, score: curr });
  }

  if (basins.length === 0) {
    let bestIndex = 0;
    for (let i = 1; i < coarseSamples; i++) {
      if (scores[i]! < scores[bestIndex]!) bestIndex = i;
    }
    return {
      date: msToDate(startMs + (span * bestIndex) / divisor),
      score: scores[bestIndex]!,
    };
  }

  basins.sort((a, b) => a.score - b.score);
  const step = span / divisor;

  let best: MinimizeResult | null = null;
  for (const basin of basins.slice(0, maxBasins)) {
    const left = Math.max(startMs, startMs + (basin.index - 1) * step);
    const right = Math.min(endMs, startMs + (basin.index + 1) * step);
    const refined = goldenSectionMinimize(left, right, fn);
    const coarse: MinimizeResult = {
      date: msToDate(startMs + basin.index * step),
      score: basin.score,
    };
    const local = refined.score <= coarse.score ? refined : coarse;
    if (!best || local.score < best.score) best = local;
  }

  return best;
}
