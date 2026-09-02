import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FieldMode } from '../components/inputs/SolvableField';
import { parseUrlFieldModes } from '../lib/fieldModes';

type ParamValue = number | string;

export function useScenarioParams<T extends Record<string, ParamValue>>(
  defaults: T,
): [
  T,
  Record<string, FieldMode>,
  (key: keyof T, value: ParamValue) => void,
  (key: string, mode: FieldMode) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const param = searchParams.get(key);
      if (param !== null) {
        const def = defaults[key as keyof T];
        if (typeof def === 'number') {
          const parsed = Number(param);
          result[key as keyof T] = (Number.isFinite(parsed) ? parsed : def) as T[keyof T];
        } else {
          result[key as keyof T] = param as T[keyof T];
        }
      }
    }
    return result;
  }, [searchParams, defaults]);

  const modes = useMemo(() => parseUrlFieldModes(searchParams), [searchParams]);

  const setValue = useCallback(
    (key: keyof T, value: ParamValue) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(String(key), String(value));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setMode = useCallback(
    (key: string, mode: FieldMode) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(`${key}_mode`, mode);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [values, modes, setValue, setMode];
}
