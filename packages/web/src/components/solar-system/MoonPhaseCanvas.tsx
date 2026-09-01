import { useEffect, useRef } from 'react';
import type { MoonPhaseInfo } from 'physics-engine';
import { moonDiskGeometry } from 'physics-engine';

interface MoonPhaseCanvasProps {
  phase: MoonPhaseInfo;
  size?: number;
}

const SHADOW = '#1a2332';
const SURFACE = '#f5f3ce';
const LIMB = '#8b9cb3';

export function MoonPhaseCanvas({ phase, size = 240 }: MoonPhaseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.35;
    const geometry = moonDiskGeometry(phase.phaseAngleDeg);
    const a = r * geometry.terminatorAxisRatio;
    const { litOnRight, gibbous } = geometry;

    ctx.fillStyle = SHADOW;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = SURFACE;
    ctx.beginPath();
    if (litOnRight) {
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.ellipse(cx, cy, a, r, 0, Math.PI / 2, -Math.PI / 2, !gibbous);
    } else {
      ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2, false);
      ctx.ellipse(cx, cy, a, r, 0, -Math.PI / 2, Math.PI / 2, !gibbous);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = LIMB;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [phase, size]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      style={{ display: 'block', margin: '0 auto', width: size, height: size }}
      aria-label={`${phase.name}, ${(phase.illuminationFraction * 100).toFixed(0)} percent illuminated`}
    />
  );
}
