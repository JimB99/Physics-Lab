import { useEffect, useRef } from 'react';
import type { ComparisonSeries } from 'physics-engine';

interface CompareSimulationProps {
  series: ComparisonSeries[];
  isProjectile: boolean;
}

export function CompareSimulation({ series, isProjectile }: CompareSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || series.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const pad = 30;

    let maxX = 1;
    let maxY = 1;
    for (const s of series) {
      for (const p of s.samples) {
        maxY = Math.max(maxY, p.y);
        maxX = Math.max(maxX, isProjectile ? p.x : p.t);
      }
    }

    const toX = (x: number) => pad + (x / (maxX || 1)) * (w - 2 * pad);
    const toY = (y: number) => h - pad - (y / (maxY || 1)) * (h - 2 * pad);

    ctx.strokeStyle = '#2d3a4f';
    ctx.beginPath();
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(w - pad, toY(0));
    ctx.stroke();

    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.samples.forEach((p, i) => {
        const px = isProjectile ? toX(p.x) : w / 2;
        const py = toY(p.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const last = s.samples[s.samples.length - 1];
      if (last) {
        const px = isProjectile ? toX(last.x) : w / 2;
        const py = toY(last.y);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [series, isProjectile]);

  if (series.length === 0) return <p className="muted">No simulation data.</p>;

  return (
    <div>
      <canvas ref={canvasRef} width={500} height={280} style={{ width: '100%', maxWidth: 500, display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {series.map((s) => (
          <span key={s.label} style={{ color: s.color, fontSize: '0.85rem' }}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}
