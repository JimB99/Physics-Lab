import { radToDeg } from '../units';
import type { MotionSample, ScenarioSummary } from '../types';

/**
 * Derives a scenario summary from an already-integrated trajectory. Use this
 * whenever the trajectory came from numerical integration, so the reported
 * flight time and impact speed match the samples the user is looking at.
 */
export function summarizeSamples(samples: MotionSample[]): ScenarioSummary | null {
  if (samples.length === 0) return null;

  const first = samples[0]!;
  const last = samples[samples.length - 1]!;

  let maxHeight = first.y;
  let timeToMaxHeight = first.t;
  let movesHorizontally = false;

  for (const sample of samples) {
    if (sample.y > maxHeight) {
      maxHeight = sample.y;
      timeToMaxHeight = sample.t;
    }
    if (sample.x !== 0) movesHorizontally = true;
  }

  const summary: ScenarioSummary = {
    flightTime: last.t,
    maxHeight,
    impactSpeed: last.speed,
    impactVelocityY: last.vy,
    timeToMaxHeight,
  };

  if (movesHorizontally) {
    summary.horizontalDistance = last.x;
    summary.impactAngle = radToDeg(Math.atan2(last.vy, last.vx));
  }

  return summary;
}
