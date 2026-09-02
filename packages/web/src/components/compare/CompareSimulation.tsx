import { useEffect, useRef } from 'react';
import type { ComparisonSeries } from 'physics-engine';
import { formatNumber } from 'physics-engine';
import { prepareCanvas, useCanvasSize } from '../../lib/canvas';
import { mergeProjectileXMarks } from '../../lib/trajectoryMarks';

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

    const padLeft = 36;
    const padRight = isProjectile ? 36 : 12;
    const padTop = 10;
    const padBottom = isProjectile ? 44 : 28;
    let maxX = 1;
    let maxY = 1;
    for (const s of series) {
      for (const p of s.samples) {
        if (p.y > maxY) maxY = p.y;
        const x = isProjectile ? p.x : p.t;
        if (x > maxX) maxX = x;
      }
    }

    const toX = (x: number) => padLeft + (x / maxX) * (w - padLeft - padRight);
    const toY = (y: number) => h - padBottom - (y / maxY) * (h - padTop - padBottom);

    const laneWidth = (w - padLeft - padRight) / Math.max(series.length, 1);
    const laneX = (index: number) => padLeft + laneWidth * (index + 0.5);

    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2d3a4f';
    const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8b9cb3';

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, toY(0));
    ctx.lineTo(w - padRight, toY(0));
    ctx.stroke();

    if (isProjectile) {
      const axisY = toY(0);
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = mutedColor;
      for (const mark of mergeProjectileXMarks(series, maxX)) {
        const x = toX(mark.x);
        ctx.save();
        ctx.strokeStyle = mutedColor;
        ctx.globalAlpha = 0.35;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, axisY);
        ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = mutedColor;
        ctx.beginPath();
        ctx.moveTo(x, axisY - 5);
        ctx.lineTo(x, axisY + 5);
        ctx.stroke();
        const caption = mark.kind === 'apex' ? 'apex' : 'land';
        ctx.fillText(`${formatNumber(mark.x, 1)} m`, x, axisY + 7);
        ctx.fillText(caption, x, axisY + 20);
      }
      ctx.textBaseline = 'alphabetic';
    }

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
