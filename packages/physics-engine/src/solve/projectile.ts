import { degToRad, radToDeg } from '../units';
import type { Environment } from '../types';
import { firstImpactTime, maxHeight1D, positionProjectile } from '../motion/kinematics';
import type { FieldSpec, ProjectileFieldId, SolveStatus, SolveStep, Vertical1DFieldId } from './types';
import { approxEqual } from './types';
import { solveVertical1D } from './vertical-1d';

type State = Partial<Record<ProjectileFieldId, number>>;

const VERTICAL_FIELD_IDS: string[] = [
  'h0',
  'v0',
  't',
  'y',
  'v',
  'impactTime',
  'impactVelocity',
  'maxHeight',
  'timeToMaxHeight',
];

function setValue(
  state: State,
  field: ProjectileFieldId,
  value: number,
  steps: SolveStep[],
  step: SolveStep,
  conflicts: string[],
): void {
  const existing = state[field];
  if (existing !== undefined) {
    if (!approxEqual(existing, value)) {
      conflicts.push(`${field}: given ${existing}, computed ${value}`);
    }
    return;
  }
  state[field] = value;
  steps.push(step);
}

/** Launch angles (deg, ascending) that give `range` for `v0` on flat ground. */
function anglesForRange(v0: number, range: number, g: number): number[] {
  if (v0 <= 0 || range <= 0) return [];
  const sin2Theta = (range * g) / (v0 * v0);
  if (sin2Theta > 1) return [];
  const low = radToDeg(Math.asin(sin2Theta)) / 2;
  const high = 90 - low;
  return approxEqual(low, high) ? [low] : [low, high];
}

export function solveProjectile(
  fields: FieldSpec<ProjectileFieldId>[],
  env: Environment,
): SolveStatus {
  const given: State = {};
  const toSolve = new Set<ProjectileFieldId>();
  const steps: SolveStep[] = [];
  const conflicts: string[] = [];

  for (const f of fields) {
    if (f.mode === 'given') {
      if (f.value === undefined || !Number.isFinite(f.value)) {
        return { status: 'noSolution', message: `Given field "${f.id}" needs a numeric value` };
      }
      const existing = given[f.id];
      if (existing !== undefined && !approxEqual(existing, f.value)) {
        return {
          status: 'overconstrained',
          message: 'Conflicting given values',
          conflicts: [`${f.id} specified twice with different values`],
        };
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
  const multiValues: Record<string, number[]> = {};

  if (state.v0 === undefined && state.vx !== undefined && state.vy !== undefined) {
    const speed = Math.hypot(state.vx, state.vy);
    setValue(state, 'v0', speed, steps, {
      equation: 'v₀ = √(v_x² + v_y²)',
      description: 'Launch speed from components',
      field: 'v0',
      result: speed,
    }, conflicts);
    const derivedAngle = radToDeg(Math.atan2(state.vy, state.vx));
    setValue(state, 'angle', derivedAngle, steps, {
      equation: 'θ = atan2(v_y, v_x)',
      description: 'Launch angle from components',
      field: 'angle',
      result: derivedAngle,
    }, conflicts);
  }

  if (
    state.angle === undefined &&
    state.v0 !== undefined &&
    state.range !== undefined &&
    (state.h0 === undefined || approxEqual(state.h0, 0))
  ) {
    const angles = anglesForRange(state.v0, state.range, g);
    if (angles.length === 0) {
      return {
        status: 'noSolution',
        message: 'That range is not reachable at this launch speed on flat ground',
      };
    }
    multiValues.angle = angles;
    setValue(state, 'angle', angles[0]!, steps, {
      equation: 'sin(2θ) = R g / v₀²',
      description: 'Launch angle from range (flat ground; low-angle solution)',
      field: 'angle',
      result: angles[0]!,
    }, conflicts);
  }

  const h0 = state.h0;
  const v0 = state.v0;
  const angle = state.angle;

  if (h0 !== undefined && v0 !== undefined && angle !== undefined) {
    const angleRad = degToRad(angle);
    const vy0 = v0 * Math.sin(angleRad);

    if (state.t !== undefined) {
      const pos = positionProjectile(h0, v0, angleRad, g, state.t);
      const speedAtT = Math.hypot(pos.vx, pos.vy);
      setValue(state, 'x', pos.x, steps, {
        equation: 'x = v₀ cos(θ) t',
        description: 'Horizontal position at t',
        field: 'x',
        result: pos.x,
      }, conflicts);
      setValue(state, 'y', pos.y, steps, {
        equation: 'y = h₀ + v₀ sin(θ) t − ½gt²',
        description: 'Vertical position at t',
        field: 'y',
        result: pos.y,
      }, conflicts);
      setValue(state, 'vx', pos.vx, steps, {
        equation: 'v_x = v₀ cos(θ)',
        description: 'Horizontal velocity',
        field: 'vx',
        result: pos.vx,
      }, conflicts);
      setValue(state, 'vy', pos.vy, steps, {
        equation: 'v_y = v₀ sin(θ) − gt',
        description: 'Vertical velocity at t',
        field: 'vy',
        result: pos.vy,
      }, conflicts);
      setValue(state, 'v', speedAtT, steps, {
        equation: '|v| = √(v_x² + v_y²)',
        description: 'Speed at t',
        field: 'v',
        result: speedAtT,
      }, conflicts);
    }

    const impact = firstImpactTime(h0, vy0, g);
    if (impact !== null) {
      const end = positionProjectile(h0, v0, angleRad, g, impact);
      const impactSpeed = Math.hypot(end.vx, end.vy);
      const impactAngle = radToDeg(Math.atan2(end.vy, end.vx));
      setValue(state, 'flightTime', impact, steps, {
        equation: 'y(t) = 0',
        description: 'Flight time',
        field: 'flightTime',
        result: impact,
      }, conflicts);
      setValue(state, 'impactTime', impact, steps, {
        equation: 'y(t) = 0',
        description: 'Impact time',
        field: 'impactTime',
        result: impact,
      }, conflicts);
      setValue(state, 'range', end.x, steps, {
        equation: 'R = v₀ cos(θ) · t_impact',
        description: 'Horizontal range',
        field: 'range',
        result: end.x,
      }, conflicts);
      setValue(state, 'impactVelocity', impactSpeed, steps, {
        equation: '|v| at impact',
        description: 'Impact speed',
        field: 'impactVelocity',
        result: impactSpeed,
      }, conflicts);
      setValue(state, 'impactAngle', impactAngle, steps, {
        equation: 'atan2(v_y, v_x)',
        description: 'Impact angle',
        field: 'impactAngle',
        result: impactAngle,
      }, conflicts);
    }

    const maxH = maxHeight1D(h0, vy0, g);
    setValue(state, 'maxHeight', maxH, steps, {
      equation: 'h_max = h₀ + (v₀ sin θ)²/(2g)',
      description: 'Maximum height',
      field: 'maxHeight',
      result: maxH,
    }, conflicts);

    if (vy0 > 0) {
      setValue(state, 'timeToMaxHeight', vy0 / g, steps, {
        equation: 't_max = v₀ sin(θ) / g',
        description: 'Time to max height',
        field: 'timeToMaxHeight',
        result: vy0 / g,
      }, conflicts);
    }
  } else {
    const verticalFields = fields.filter((f) => VERTICAL_FIELD_IDS.includes(f.id));
    if (verticalFields.length > 0) {
      const vResult = solveVertical1D(verticalFields as FieldSpec<Vertical1DFieldId>[], env);
      if (vResult.status === 'solved') {
        Object.assign(state, vResult.values);
      }
    }
  }

  if (conflicts.length > 0) {
    return {
      status: 'overconstrained',
      message: 'Given values are inconsistent',
      conflicts: [...new Set(conflicts)],
    };
  }

  const missing: string[] = [];
  for (const id of toSolve) {
    if (state[id] === undefined && multiValues[id] === undefined) missing.push(id);
  }

  const values: Record<string, number> = {};
  for (const id of toSolve) {
    const resolved = state[id];
    if (resolved !== undefined) values[id] = resolved;
  }

  if (Object.keys(values).length === 0 && Object.keys(multiValues).length === 0) {
    const needLaunch =
      state.h0 === undefined || state.v0 === undefined || state.angle === undefined;
    return {
      status: 'underdetermined',
      message: needLaunch
        ? 'Need h₀, v₀, and launch angle (or enough info to derive them)'
        : 'Not enough information to solve for all fields',
      missing,
    };
  }

  return {
    status: 'solved',
    values,
    multiValues: Object.keys(multiValues).length > 0 ? multiValues : undefined,
    steps,
  };
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
