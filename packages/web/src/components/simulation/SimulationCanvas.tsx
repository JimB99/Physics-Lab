import { useEffect, useRef, useState } from 'react';
import type { MotionSample } from 'physics-engine';
import { formatNumber } from 'physics-engine';
import { PlaybackControls } from './PlaybackControls';

interface SimulationCanvasProps {
  samples: MotionSample[];
  isProjectile?: boolean;
  highlightTime?: number;
  onTimeChange?: (t: number) => void;
}

export function SimulationCanvas({
  samples,
  isProjectile = false,
  highlightTime,
  onTimeChange,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeIndex, setTimeIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const currentIndex = highlightTime !== undefined
    ? Math.max(0, samples.findIndex((_, i) => i === samples.length - 1 || samples[i + 1]!.t > highlightTime))
    : timeIndex;

  const sample = samples[currentIndex] ?? samples[0];

  useEffect(() => {
    if (!playing || samples.length === 0) return;
    const id = setInterval(() => {
      setTimeIndex((i) => {
        const next = i + 1;
        if (next >= samples.length) {
          setPlaying(false);
          return samples.length - 1;
        }
        onTimeChange?.(samples[next]!.t);
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [playing, samples, onTimeChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || samples.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const pad = 30;
    const xs = samples.map((s) => (isProjectile ? s.x : 0));
    const ys = samples.map((s) => s.y);
    const minX = isProjectile ? Math.min(...xs) : 0;
    const maxX = isProjectile ? Math.max(...xs, 1) : 1;
    const minY = 0;
    const maxY = Math.max(...ys, 1);

    const toX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - 2 * pad);
    const toY = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - 2 * pad);

    ctx.strokeStyle = '#2d3a4f';
    ctx.beginPath();
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(w - pad, toY(0));
    ctx.stroke();

    ctx.strokeStyle = '#4da3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const px = isProjectile ? toX(s.x) : w / 2;
      const py = toY(s.y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    if (sample) {
      const px = isProjectile ? toX(sample.x) : w / 2;
      const py = toY(sample.y);
      ctx.fillStyle = '#f0b429';
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();

      if (isProjectile) {
        const scale = 0.3;
        ctx.strokeStyle = '#3dd68c';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + sample.vx * scale, py - sample.vy * scale);
        ctx.stroke();
      }
    }
  }, [samples, sample, isProjectile]);

  if (samples.length === 0) {
    return <p className="muted">Run a valid scenario to see the simulation.</p>;
  }

  const duration = samples[samples.length - 1]!.t;

  return (
    <div>
      <canvas ref={canvasRef} width={500} height={280} style={{ width: '100%', maxWidth: 500, display: 'block', margin: '0 auto' }} />
      {sample && (
        <div className="muted" style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
          t = {formatNumber(sample.t)} s · y = {formatNumber(sample.y)} m
          {isProjectile && ` · x = ${formatNumber(sample.x)} m`}
          {' · '}Ek = {formatNumber(sample.kineticEnergy)} J · Ep = {formatNumber(sample.potentialEnergy)} J
        </div>
      )}
      <PlaybackControls
        playing={playing}
        time={sample?.t ?? 0}
        duration={duration}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onRestart={() => {
          setTimeIndex(0);
          setPlaying(false);
          onTimeChange?.(0);
        }}
        onScrub={(t) => {
          const idx = samples.findIndex((_, i) => i === samples.length - 1 || samples[i + 1]!.t > t);
          setTimeIndex(Math.max(0, idx));
          onTimeChange?.(t);
        }}
      />
    </div>
  );
}
