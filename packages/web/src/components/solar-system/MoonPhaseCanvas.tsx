import { useEffect, useRef } from 'react';
import type { MoonPhaseInfo } from 'physics-engine';

interface MoonPhaseCanvasProps {
  phase: MoonPhaseInfo;
}

export function MoonPhaseCanvas({ phase }: MoonPhaseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.35;

    ctx.fillStyle = '#2d3a4f';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5f3ce';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    const lit = phase.illuminationFraction;
    const angle = ((phase.phaseAngleDeg - 90) * Math.PI) / 180;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#2d3a4f';
    if (lit < 0.5) {
      const offset = radius * (1 - lit * 2);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * offset, cy + Math.sin(angle) * offset, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const offset = radius * ((lit - 0.5) * 2);
      ctx.beginPath();
      ctx.arc(cx - Math.cos(angle) * offset, cy - Math.sin(angle) * offset, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = '#8b9cb3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      style={{ display: 'block', margin: '0 auto' }}
      aria-label={`Moon phase: ${phase.name}`}
    />
  );
}
