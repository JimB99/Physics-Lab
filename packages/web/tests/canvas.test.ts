import { describe, expect, it } from 'vitest';
import { extent } from '../src/lib/canvas';

describe('extent', () => {
  it('returns the min and max', () => {
    expect(extent([3, -1, 7, 0])).toEqual({ min: -1, max: 7 });
  });

  it('handles an empty array', () => {
    expect(extent([])).toEqual({ min: 0, max: 0 });
  });

  it('does not overflow the call stack on very large arrays', () => {
    const big = new Array(500_000);
    for (let i = 0; i < big.length; i++) big[i] = i % 1000;
    expect(() => extent(big)).not.toThrow();
    expect(extent(big)).toEqual({ min: 0, max: 999 });
  });

  it('ignores non-finite values', () => {
    expect(extent([1, Number.NaN, 5, Number.POSITIVE_INFINITY])).toEqual({ min: 1, max: 5 });
  });
});
