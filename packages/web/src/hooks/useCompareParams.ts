import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_VARIANTS,
  decodeVariant,
  encodeVariant,
  variantColor,
  type CompareScenario,
  type CompareType,
  type VariantConfig,
} from '../lib/compareDefaults';

export interface CompareParams {
  scenario: CompareScenario;
  compareType: CompareType;
  variants: VariantConfig[];
}

const VARIANT_IDS = ['a', 'b', 'c'];

export function useCompareParams(): [CompareParams, (patch: Partial<CompareParams>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo((): CompareParams => {
    const scenarioParam = searchParams.get('scenario');
    const scenario: CompareScenario = scenarioParam === 'projectile' ? 'projectile' : 'vertical1d';

    const typeParam = searchParams.get('type');
    const compareType: CompareType =
      typeParam === 'drag' || (typeParam === 'angle' && scenario === 'projectile')
        ? typeParam
        : 'environment';

    const raw = searchParams.getAll('v');
    const decoded = raw
      .slice(0, 3)
      .map((entry, index) => decodeVariant(VARIANT_IDS[index]!, entry, variantColor(index)))
      .filter((v): v is VariantConfig => v !== null);

    return {
      scenario,
      compareType,
      variants: decoded.length >= 2 ? decoded : DEFAULT_VARIANTS,
    };
  }, [searchParams]);

  const setParams = useCallback(
    (patch: Partial<CompareParams>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (patch.scenario !== undefined) next.set('scenario', patch.scenario);
          if (patch.compareType !== undefined) next.set('type', patch.compareType);
          if (patch.variants !== undefined) {
            next.delete('v');
            for (const variant of patch.variants) next.append('v', encodeVariant(variant));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [params, setParams];
}
