import type { Environment } from '../types';
import {
  firstImpactTime,
  maxHeight1D,
  position1D,
  timeToMaxHeight1D,
  timesAtHeight,
  velocity1D,
} from '../motion/kinematics';
import type { FieldSpec, SolveStatus, SolveStep, Vertical1DFieldId } from './types';
import { approxEqual } from './types';

type State = Partial<Record<Vertical1DFieldId, number>>;

function addStep(steps: SolveStep[], step: SolveStep): void {
  steps.push(step);
}

function setValue(
  state: State,
  field: Vertical1DFieldId,
  value: number,
  steps: SolveStep[],
  step: SolveStep,
  conflicts: string[],
): boolean {
  const existing = state[field];
  if (existing !== undefined) {
    if (!approxEqual(existing, value)) {
      conflicts.push(`${field}: given ${existing}, computed ${value}`);
    }
    return false;
  }
  state[field] = value;
  addStep(steps, step);
  return true;
}

function deriveFromBasics(state: State, g: number, steps: SolveStep[], conflicts: string[]): boolean {
  let changed = false;
  const h0 = state.h0;
  const v0 = state.v0;

  if (h0 !== undefined && v0 !== undefined) {
    if (state.t !== undefined) {
      const y = position1D(h0, v0, g, state.t);
      const v = velocity1D(v0, g, state.t);
      changed =
        setValue(state, 'y', y, steps, {
          equation: 'y = h₀ + v₀t − ½gt²',
          description: 'Position at time t',
          field: 'y',
          result: y,
        }, conflicts) || changed;
      changed =
        setValue(state, 'v', v, steps, {
          equation: 'v = v₀ − gt',
          description: 'Velocity at time t',
          field: 'v',
          result: v,
        }, conflicts) || changed;
    }

    const impact = firstImpactTime(h0, v0, g);
    if (impact !== null) {
      const vImpact = velocity1D(v0, g, impact);
      changed =
        setValue(state, 'impactTime', impact, steps, {
          equation: 'y(t) = 0',
          description: 'Time to impact',
          field: 'impactTime',
          result: impact,
        }, conflicts) || changed;
      changed =
        setValue(state, 'impactVelocity', vImpact, steps, {
          equation: 'v = v₀ − gt',
          description: 'Velocity at impact',
          field: 'impactVelocity',
          result: vImpact,
        }, conflicts) || changed;
    }

    const maxH = maxHeight1D(h0, v0, g);
    changed =
      setValue(state, 'maxHeight', maxH, steps, {
        equation: 'h_max = h₀ + v₀²/(2g)',
        description: 'Maximum height',
        field: 'maxHeight',
        result: maxH,
      }, conflicts) || changed;

    const tMax = timeToMaxHeight1D(v0, g);
    if (tMax !== null) {
      changed =
        setValue(state, 'timeToMaxHeight', tMax, steps, {
          equation: 't_max = v₀/g',
          description: 'Time to maximum height',
          field: 'timeToMaxHeight',
          result: tMax,
        }, conflicts) || changed;
    }
  }

  return changed;
}

function deriveBasics(state: State, g: number, steps: SolveStep[], conflicts: string[]): boolean {
  let changed = false;
  const { h0, v0, t, y, v } = state;

  if (h0 !== undefined && t !== undefined && y !== undefined && v0 === undefined) {
    const computed = (y - h0 + 0.5 * g * t * t) / t;
    changed =
      setValue(state, 'v0', computed, steps, {
        equation: 'v₀ = (y − h₀ + ½gt²) / t',
        description: 'Initial velocity from position at t',
        field: 'v0',
        result: computed,
      }, conflicts) || changed;
  }

  if (h0 !== undefined && t !== undefined && v !== undefined && v0 === undefined) {
    const computed = v + g * t;
    changed =
      setValue(state, 'v0', computed, steps, {
        equation: 'v₀ = v + gt',
        description: 'Initial velocity from velocity at t',
        field: 'v0',
        result: computed,
      }, conflicts) || changed;
  }

  if (v0 !== undefined && t !== undefined && y !== undefined && h0 === undefined) {
    const computed = y - v0 * t + 0.5 * g * t * t;
    changed =
      setValue(state, 'h0', computed, steps, {
        equation: 'h₀ = y − v₀t + ½gt²',
        description: 'Initial height from position at t',
        field: 'h0',
        result: computed,
      }, conflicts) || changed;
  }

  if (h0 !== undefined && v0 !== undefined && y !== undefined && t === undefined) {
    const times = timesAtHeight(h0, v0, g, y);
    if (times.length === 1) {
      changed =
        setValue(state, 't', times[0]!, steps, {
          equation: 'y = h₀ + v₀t − ½gt²',
          description: 'Time at height y',
          field: 't',
          result: times[0]!,
        }, conflicts) || changed;
    }
  }

  return changed;
}

export function solveVertical1D(
  fields: FieldSpec<Vertical1DFieldId>[],
  env: Environment,
): SolveStatus {
  const g = env.g;
  const given: State = {};
  const toSolve = new Set<Vertical1DFieldId>();
  const steps: SolveStep[] = [];

  for (const f of fields) {
    if (f.mode === 'given') {
      if (f.value === undefined || !Number.isFinite(f.value)) {
        return { status: 'noSolution', message: `Given field "${f.id}" needs a numeric value` };
      }
      if (f.id in given && !approxEqual(given[f.id]!, f.value)) {
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

  const state: State = { ...given };
  const conflicts: string[] = [];
  let iterations = 0;
  let changed = true;
  while (changed && iterations < 20) {
    changed = false;
    iterations++;
    changed = deriveBasics(state, g, steps, conflicts) || changed;
    changed = deriveFromBasics(state, g, steps, conflicts) || changed;
  }

  if (conflicts.length > 0) {
    return {
      status: 'overconstrained',
      message: 'Given values are inconsistent',
      conflicts: [...new Set(conflicts)],
    };
  }

  const multiValues: Record<string, number[]> = {};
  if (state.h0 !== undefined && state.v0 !== undefined && given.y !== undefined && state.t === undefined) {
    const times = timesAtHeight(state.h0, state.v0, g, given.y);
    if (times.length > 1) {
      multiValues.t = times;
      multiValues.v = times.map((t) => velocity1D(state.v0!, g, t));
    }
  }

  const missing: string[] = [];
  for (const id of toSolve) {
    if (!(id in state) && !(id in multiValues)) {
      missing.push(id);
    }
  }

  const values: Record<string, number> = {};
  for (const id of toSolve) {
    if (id in state) values[id] = state[id]!;
  }

  if (Object.keys(values).length === 0 && Object.keys(multiValues).length === 0) {
    return {
      status: 'underdetermined',
      message: 'Not enough information to solve for all fields',
      missing,
    };
  }

  return { status: 'solved', values, multiValues: Object.keys(multiValues).length ? multiValues : undefined, steps };
}

export function resolvedVertical1DInputs(
  solveResult: Extract<SolveStatus, { status: 'solved' }>,
  given: State,
): { h0: number; v0: number } | null {
  const h0 = given.h0 ?? solveResult.values.h0;
  const v0 = given.v0 ?? solveResult.values.v0;
  if (h0 === undefined || v0 === undefined) return null;
  return { h0, v0 };
}
