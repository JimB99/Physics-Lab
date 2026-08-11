export type FieldMode = 'given' | 'solve';

export interface FieldSpec<T extends string = string> {
  id: T;
  mode: FieldMode;
  value?: number;
}

export interface SolveStep {
  equation: string;
  description: string;
  field: string;
  result: number;
}

export type Vertical1DFieldId =
  | 'h0'
  | 'v0'
  | 't'
  | 'y'
  | 'v'
  | 'impactTime'
  | 'impactVelocity'
  | 'maxHeight'
  | 'timeToMaxHeight';

export type ProjectileFieldId =
  | Vertical1DFieldId
  | 'angle'
  | 'vx'
  | 'vy'
  | 'range'
  | 'flightTime'
  | 'impactAngle'
  | 'x';

export type SolveStatus =
  | {
      status: 'solved';
      values: Record<string, number>;
      multiValues?: Record<string, number[]>;
      steps: SolveStep[];
    }
  | { status: 'underdetermined'; message: string; missing: string[] }
  | { status: 'overconstrained'; message: string; conflicts: string[] }
  | { status: 'noSolution'; message: string };

export function approxEqual(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}
