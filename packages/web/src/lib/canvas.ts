import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export function prepareCanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
): CanvasFrame | null {
  const ctx = canvas.getContext('2d');
  if (!ctx || cssWidth <= 0 || cssHeight <= 0) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  return { ctx, width: cssWidth, height: cssHeight };
}

export function extent(values: readonly number[]): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    const value = values[i]!;
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === Number.POSITIVE_INFINITY) return { min: 0, max: 0 };
  return { min, max };
}

export function useCanvasSize(
  ref: RefObject<HTMLElement | null>,
  aspectRatio: number,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 500, height: Math.round(500 / aspectRatio) });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      if (width > 0) setSize({ width, height: Math.round(width / aspectRatio) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, aspectRatio]);

  return size;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  return reduced;
}
