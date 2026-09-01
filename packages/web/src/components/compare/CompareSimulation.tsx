import { useEffect, useRef } from 'react';
import type { ComparisonSeries } from 'physics-engine';
import { prepareCanvas, useCanvasSize } from '../../lib/canvas';

interface CompareSimulationProps {
  series: ComparisonSeries[];
  isProjectile: boolean;
}

const ASPECT_RATIO = 500 / 280;

export function CompareSimulation({ series, isProjectile }: CompareSimulationProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useCanvasSize(wrapperRef, ASPECT_RATIO);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || series.length === 0) return;
    const frame = prepareCanvas(canvas, width, height);
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;

    const pad = 30;
    let maxX = 1;
    let maxY = 1;
    for (const s of series) {
      for (const p of s.samples) {
        if (p.y > maxY) maxY = p.y;
        const x = isProjectile ? p.x : p.t;
        if (x > maxX) maxX = x;
      }
    }

    const toX = (x: number) => pad + (x / maxX) * (w - 2 * pad);
    const toY = (y: number) => h - pad - (y / maxY) * (h - 2 * pad);

    const laneWidth = (w - 2 * pad) / Math.max(series.length, 1);
    const laneX = (index: number) => pad + laneWidth * (index + 0.5);

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2d3a4f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(w - pad, toY(0));
    ctx.stroke();

    series.forEach((s, index) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < s.samples.length; i++) {
        const p = s.samples[i]!;
        const px = isProjectile ? toX(p.x) : laneX(index);
        const py = toY(p.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const last = s.samples[s.samples.length - 1];
      if (last) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(isProjectile ? toX(last.x) : laneX(index), toY(last.y), 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [series, isProjectile, width, height]);

  if (series.length === 0) return <p className="muted">No simulation data.</p>;

  return (
    <div ref={wrapperRef}>
      <canvas ref={canvasRef} role="img" aria-label="Comparison of variant trajectories" style={{ display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {series.map((s) => (
          <span key={s.label} style={{ color: s.color, fontSize: '0.85rem' }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
