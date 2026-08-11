import { G0 } from '../constants';
import type { Environment, MotionSample, SampleOptions } from '../types';
import { kineticEnergy, potentialEnergy, totalMechanicalEnergy } from '../energy/mechanical';
import { gravitationalForce } from '../forces/gravity';

export function position1D(h0: number, v0: number, g: number, t: number): number {
  return h0 + v0 * t - 0.5 * g * t * t;
}

export function velocity1D(v0: number, g: number, t: number): number {
  return v0 - g * t;
}

export function impactTimes(h0: number, v0: number, g: number): number[] {
  const a = -0.5 * g;
  const b = v0;
  const c = h0;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b + sqrtD) / (2 * a);
  const t2 = (-b - sqrtD) / (2 * a);
  return [t1, t2].filter((t) => t >= 0 && Number.isFinite(t)).sort((x, y) => x - y);
}

export function firstImpactTime(h0: number, v0: number, g: number): number | null {
  const times = impactTimes(h0, v0, g);
  return times.length > 0 ? times[times.length - 1]! : null;
}

export function timesAtHeight(h0: number, v0: number, g: number, y: number): number[] {
  const a = -0.5 * g;
  const b = v0;
  const c = h0 - y;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b + sqrtD) / (2 * a);
  const t2 = (-b - sqrtD) / (2 * a);
  return [t1, t2].filter((t) => t >= 0 && Number.isFinite(t)).sort((x, y) => x - y);
}

export function maxHeight1D(h0: number, v0: number, g: number): number {
  if (v0 <= 0) return h0;
  return h0 + (v0 * v0) / (2 * g);
}

export function timeToMaxHeight1D(v0: number, g: number): number | null {
  if (v0 <= 0) return null;
  return v0 / g;
}

export function buildVerticalSample(
  t: number,
  h0: number,
  v0: number,
  env: Environment,
): Omit<MotionSample, 'x' | 'vx' | 'vy' | 'ax' | 'ay'> & { y: number; v: number } {
  const y = position1D(h0, v0, env.g, t);
  const v = velocity1D(v0, env.g, t);
  const speed = Math.abs(v);
  const Ek = kineticEnergy(env.mass, speed);
  const Ep = potentialEnergy(env.mass, env.g, Math.max(y, 0));
  const Etotal = totalMechanicalEnergy(Ek, Ep);
  const gForce = env.g / G0;
  const Fg = gravitationalForce(env.mass, env.g);
  return { t, y, v, speed, kineticEnergy: Ek, potentialEnergy: Ep, totalMechanicalEnergy: Etotal, gForce, gravitationalForce: Fg };
}

export function sampleVertical1DTrajectory(
  h0: number,
  v0: number,
  env: Environment,
  options: SampleOptions = {},
): MotionSample[] {
  const step = options.step ?? 0.05;
  const impact = firstImpactTime(h0, v0, env.g);
  const duration = options.duration ?? impact ?? step;
  const samples: MotionSample[] = [];
  for (let t = 0; t <= duration + step / 2; t += step) {
    const actualT = Math.min(t, duration);
    const s = buildVerticalSample(actualT, h0, v0, env);
    samples.push({
      t: actualT,
      x: 0,
      y: s.y,
      vx: 0,
      vy: s.v,
      ax: 0,
      ay: -env.g,
      speed: s.speed,
      kineticEnergy: s.kineticEnergy,
      potentialEnergy: s.potentialEnergy,
      totalMechanicalEnergy: s.totalMechanicalEnergy,
      gForce: s.gForce,
      gravitationalForce: s.gravitationalForce,
    });
    if (actualT >= duration) break;
  }
  return samples;
}

export function positionProjectile(
  h0: number,
  v0: number,
  angleRad: number,
  g: number,
  t: number,
): { x: number; y: number; vx: number; vy: number } {
  const vx = v0 * Math.cos(angleRad);
  const vy0 = v0 * Math.sin(angleRad);
  const x = vx * t;
  const y = h0 + vy0 * t - 0.5 * g * t * t;
  const vy = vy0 - g * t;
  return { x, y, vx, vy };
}

export function sampleProjectileTrajectory(
  h0: number,
  v0: number,
  angleDeg: number,
  env: Environment,
  options: SampleOptions = {},
): MotionSample[] {
  const angleRad = (angleDeg * Math.PI) / 180;
  const step = options.step ?? 0.05;
  const impact = firstImpactTime(h0, v0 * Math.sin(angleRad), env.g);
  const duration = options.duration ?? impact ?? step;
  const samples: MotionSample[] = [];
  for (let t = 0; t <= duration + step / 2; t += step) {
    const actualT = Math.min(t, duration);
    const { x, y, vx, vy } = positionProjectile(h0, v0, angleRad, env.g, actualT);
    const speed = Math.sqrt(vx * vx + vy * vy);
    const Ek = kineticEnergy(env.mass, speed);
    const Ep = potentialEnergy(env.mass, env.g, Math.max(y, 0));
    samples.push({
      t: actualT,
      x,
      y,
      vx,
      vy,
      ax: 0,
      ay: -env.g,
      speed,
      kineticEnergy: Ek,
      potentialEnergy: Ep,
      totalMechanicalEnergy: totalMechanicalEnergy(Ek, Ep),
      gForce: env.g / G0,
      gravitationalForce: gravitationalForce(env.mass, env.g),
    });
    if (actualT >= duration) break;
  }
  return samples;
}
