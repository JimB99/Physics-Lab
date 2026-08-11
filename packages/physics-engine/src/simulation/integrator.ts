import { G0 } from '../constants';
import { kineticEnergy, potentialEnergy, totalMechanicalEnergy } from '../energy/mechanical';
import { gravitationalForce } from '../forces/gravity';
import { dragForceQuadratic } from '../forces/drag';
import type { DragConfig, Environment, MotionSample } from '../types';
import { degToRad } from '../units';

const MAX_STEPS = 100_000;

function buildSample(
  t: number,
  x: number,
  y: number,
  vx: number,
  vy: number,
  env: Environment,
  dragForce: number,
  netFy: number,
  netFx: number,
): MotionSample {
  const speed = Math.sqrt(vx * vx + vy * vy);
  const Ek = kineticEnergy(env.mass, speed);
  const Ep = potentialEnergy(env.mass, env.g, Math.max(y, 0));
  const Fg = gravitationalForce(env.mass, env.g);
  return {
    t,
    x,
    y,
    vx,
    vy,
    ax: netFx / env.mass,
    ay: netFy / env.mass,
    speed,
    kineticEnergy: Ek,
    potentialEnergy: Ep,
    totalMechanicalEnergy: totalMechanicalEnergy(Ek, Ep),
    gForce: env.g / G0,
    gravitationalForce: Fg,
    dragForce,
    netForce: Math.sqrt(netFx * netFx + netFy * netFy),
  };
}

function accel1D(v: number, drag: DragConfig): number {
  const Fg = -drag.mass * drag.g;
  const Fd = v !== 0 ? -Math.sign(v) * dragForceQuadratic(drag.rho, drag.cd, drag.area, Math.abs(v)) : 0;
  return (Fg + Fd) / drag.mass;
}

function rk4Step1D(y: number, v: number, dt: number, drag: DragConfig): { y: number; v: number } {
  const f = (_yv: number, vv: number) => ({ dy: vv, dv: accel1D(vv, drag) });
  const k1 = f(y, v);
  const k2 = f(y + 0.5 * dt * k1.dy, v + 0.5 * dt * k1.dv);
  const k3 = f(y + 0.5 * dt * k2.dy, v + 0.5 * dt * k2.dv);
  const k4 = f(y + dt * k3.dy, v + dt * k3.dv);
  return {
    y: y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
    v: v + (dt / 6) * (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv),
  };
}

export function integrateVertical1D(
  h0: number,
  v0: number,
  env: Environment,
  drag: DragConfig,
  options: { step: number; maxTime?: number },
): MotionSample[] {
  const step = options.step;
  const maxTime = options.maxTime ?? 3600;
  const samples: MotionSample[] = [];
  let y = h0;
  let v = v0;
  let t = 0;

  const Fg = gravitationalForce(env.mass, env.g);
  const initDrag = dragForceQuadratic(drag.rho, drag.cd, drag.area, Math.abs(v));
  samples.push(buildSample(0, 0, y, 0, v, env, initDrag, -Fg - Math.sign(v || -1) * initDrag, 0));

  for (let i = 0; i < MAX_STEPS && t < maxTime; i++) {
    const next = rk4Step1D(y, v, step, drag);
    t += step;
    y = next.y;
    v = next.v;

    const speed = Math.abs(v);
    const Fd = speed > 0 ? dragForceQuadratic(drag.rho, drag.cd, drag.area, speed) : 0;
    const netFy = -Fg - Math.sign(v) * Fd;

    samples.push(buildSample(t, 0, y, 0, v, env, Fd, netFy, 0));

    if (y <= 0 && t > 0) break;
  }

  return samples;
}

function accel2D(vx: number, vy: number, drag: DragConfig): { ax: number; ay: number } {
  const Fgx = 0;
  const Fgy = -drag.mass * drag.g;
  const speed = Math.sqrt(vx * vx + vy * vy);
  let Fdx = 0;
  let Fdy = 0;
  if (speed > 0 && drag.rho > 0) {
    const Fd = dragForceQuadratic(drag.rho, drag.cd, drag.area, speed);
    Fdx = -(Fd * vx) / speed;
    Fdy = -(Fd * vy) / speed;
  }
  return { ax: (Fgx + Fdx) / drag.mass, ay: (Fgy + Fdy) / drag.mass };
}

function rk4Step2D(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dt: number,
  drag: DragConfig,
): { x: number; y: number; vx: number; vy: number } {
  const deriv = (_px: number, _py: number, pvx: number, pvy: number) => {
    const a = accel2D(pvx, pvy, drag);
    return { dx: pvx, dy: pvy, dvx: a.ax, dvy: a.ay };
  };
  const k1 = deriv(x, y, vx, vy);
  const k2 = deriv(x + 0.5 * dt * k1.dx, y + 0.5 * dt * k1.dy, vx + 0.5 * dt * k1.dvx, vy + 0.5 * dt * k1.dvy);
  const k3 = deriv(x + 0.5 * dt * k2.dx, y + 0.5 * dt * k2.dy, vx + 0.5 * dt * k2.dvx, vy + 0.5 * dt * k2.dvy);
  const k4 = deriv(x + dt * k3.dx, y + dt * k3.dy, vx + dt * k3.dvx, vy + dt * k3.dvy);
  return {
    x: x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
    y: y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
    vx: vx + (dt / 6) * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx),
    vy: vy + (dt / 6) * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy),
  };
}

export function integrateProjectile2D(
  h0: number,
  v0: number,
  angleDeg: number,
  env: Environment,
  drag: DragConfig,
  options: { step: number; maxTime?: number },
): MotionSample[] {
  const angleRad = degToRad(angleDeg);
  const step = options.step;
  const maxTime = options.maxTime ?? 3600;
  const samples: MotionSample[] = [];
  let x = 0;
  let y = h0;
  let vx = v0 * Math.cos(angleRad);
  let vy = v0 * Math.sin(angleRad);
  let t = 0;

  const Fg = gravitationalForce(env.mass, env.g);
  const initSpeed = Math.sqrt(vx * vx + vy * vy);
  const initDrag = dragForceQuadratic(drag.rho, drag.cd, drag.area, initSpeed);
  samples.push(
    buildSample(0, x, y, vx, vy, env, initDrag, -Fg - (initSpeed > 0 ? (initDrag * vy) / initSpeed : 0), initSpeed > 0 ? -(initDrag * vx) / initSpeed : 0),
  );

  for (let i = 0; i < MAX_STEPS && t < maxTime; i++) {
    const next = rk4Step2D(x, y, vx, vy, step, drag);
    t += step;
    x = next.x;
    y = next.y;
    vx = next.vx;
    vy = next.vy;

    const speed = Math.sqrt(vx * vx + vy * vy);
    const Fd = speed > 0 ? dragForceQuadratic(drag.rho, drag.cd, drag.area, speed) : 0;
    const Fdx = speed > 0 ? -(Fd * vx) / speed : 0;
    const Fdy = speed > 0 ? -(Fd * vy) / speed : 0;
    const netFx = Fdx;
    const netFy = -Fg + Fdy;

    samples.push(buildSample(t, x, y, vx, vy, env, Fd, netFy, netFx));

    if (y <= 0 && t > 0) break;
  }

  return samples;
}
