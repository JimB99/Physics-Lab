import { degToRad, radToDeg } from '../units';
import type { Environment } from '../types';
import { firstImpactTime, maxHeight1D, positionProjectile } from '../motion/kinematics';
import type { FieldSpec, ProjectileFieldId, SolveStatus, SolveStep, Vertical1DFieldId } from './types';
import { approxEqual } from './types';
import { solveVertical1D } from './vertical-1d';

type State = Partial<Record<ProjectileFieldId, number>>;

function setValue(state: State, field: ProjectileFieldId, value: number, steps: SolveStep[], step: SolveStep): boolean {
  if (field in state && !approxEqual(state[field]!, value)) return false;
  if (!(field in state)) {
    state[field] = value;
    steps.push(step);
    return true;
  }
  return false;
}

export function solveProjectile(
  fields: FieldSpec<ProjectileFieldId>[],
  env: Environment,
): SolveStatus {
  const given: State = {};
  const toSolve = new Set<ProjectileFieldId>();
  const steps: SolveStep[] = [];

  for (const f of fields) {
    if (f.mode === 'given') {
      if (f.value === undefined || !Number.isFinite(f.value)) {
        return { status: 'noSolution', message: `Given field "${f.id}" needs a numeric value` };
      }
      given[f.id] = f.value;
    } else {
      toSolve.add(f.id);
    }
  }

  if (toSolve.size === 0) {
    return { status: 'underdetermined', message: 'Mark at least one field as solve for', missing: [] };
  }

  const g = env.g;
  const state: State = { ...given };
  let h0 = state.h0;
  let v0 = state.v0;
  let angle = state.angle;

  if (h0 !== undefined && v0 !== undefined && angle !== undefined) {
    const angleRad = degToRad(angle);
    const vy0 = v0 * Math.sin(angleRad);

    if (state.t !== undefined) {
      const pos = positionProjectile(h0, v0, angleRad, g, state.t);
      setValue(state, 'x', pos.x, steps, {
        equation: 'x = v₀ cos(θ) t',
        description: 'Horizontal position at t',
        field: 'x',
        result: pos.x,
      });
      setValue(state, 'y', pos.y, steps, {
        equation: 'y = h₀ + v₀ sin(θ) t − ½gt²',
        description: 'Vertical position at t',
        field: 'y',
        result: pos.y,
      });
      setValue(state, 'vx', pos.vx, steps, {
        equation: 'v_x = v₀ cos(θ)',
        description: 'Horizontal velocity',
        field: 'vx',
        result: pos.vx,
      });
      setValue(state, 'vy', pos.vy, steps, {
        equation: 'v_y = v₀ sin(θ) − gt',
        description: 'Vertical velocity at t',
        field: 'vy',
        result: pos.vy,
      });
    }

    const impact = firstImpactTime(h0, vy0, g);
    if (impact !== null) {
      const end = positionProjectile(h0, v0, angleRad, g, impact);
      const impactSpeed = Math.sqrt(end.vx * end.vx + end.vy * end.vy);
      const impactAngle = radToDeg(Math.atan2(end.vy, end.vx));
      setValue(state, 'flightTime', impact, steps, {
        equation: 'y(t) = 0',
        description: 'Flight time',
        field: 'flightTime',
        result: impact,
      });
      setValue(state, 'impactTime', impact, steps, {
        equation: 'y(t) = 0',
        description: 'Impact time',
        field: 'impactTime',
        result: impact,
      });
      setValue(state, 'range', end.x, steps, {
        equation: 'x at impact',
        description: 'Horizontal range',
        field: 'range',
        result: end.x,
      });
      setValue(state, 'impactVelocity', impactSpeed, steps, {
        equation: '|v| at impact',
        description: 'Impact speed',
        field: 'impactVelocity',
        result: impactSpeed,
      });
      setValue(state, 'impactAngle', impactAngle, steps, {
        equation: 'atan2(v_y, v_x)',
        description: 'Impact angle',
        field: 'impactAngle',
        result: impactAngle,
      });
    }

    const maxH = maxHeight1D(h0, vy0, g);
    setValue(state, 'maxHeight', maxH, steps, {
      equation: 'h_max = h₀ + (v₀ sin θ)²/(2g)',
      description: 'Maximum height',
      field: 'maxHeight',
      result: maxH,
    });

    if (vy0 > 0) {
      setValue(state, 'timeToMaxHeight', vy0 / g, steps, {
        equation: 't_max = v₀ sin(θ) / g',
        description: 'Time to max height',
        field: 'timeToMaxHeight',
        result: vy0 / g,
      });
    }
  } else {
    const verticalFields = fields.filter((f) =>
      ['h0', 'v0', 't', 'y', 'v', 'impactTime', 'impactVelocity', 'maxHeight', 'timeToMaxHeight'].includes(f.id),
    );
    if (verticalFields.length > 0) {
      const vResult = solveVertical1D(verticalFields as FieldSpec<Vertical1DFieldId>[], env);
      if (vResult.status !== 'solved') return vResult;
      Object.assign(state, given, vResult.values);
      h0 = state.h0 ?? given.h0;
      v0 = state.v0 ?? given.v0;
    }
  }

  const missing: string[] = [];
  for (const id of toSolve) {
    if (!(id in state)) missing.push(id);
  }

  if (missing.length > 0) {
    if (h0 === undefined || v0 === undefined || angle === undefined) {
      return {
        status: 'underdetermined',
        message: 'Need h₀, v₀, and launch angle (or enough info to derive them)',
        missing,
      };
    }
    return {
      status: 'underdetermined',
      message: 'Not enough information to solve for all fields',
      missing,
    };
  }

  const values: Record<string, number> = {};
  for (const id of toSolve) {
    values[id] = state[id]!;
  }

  return { status: 'solved', values, steps };
}

export function resolvedProjectileInputs(
  solveResult: Extract<SolveStatus, { status: 'solved' }>,
  given: Partial<Record<ProjectileFieldId, number>>,
): { h0: number; v0: number; angleDeg: number } | null {
  const h0 = given.h0 ?? solveResult.values.h0;
  const v0 = given.v0 ?? solveResult.values.v0;
  const angleDeg = given.angle ?? solveResult.values.angle;
  if (h0 === undefined || v0 === undefined || angleDeg === undefined) return null;
  return { h0, v0, angleDeg };
}
