import { useEffect, useMemo, useRef, useState } from 'react';
import type { MotionSample } from 'physics-engine';
import { formatNumber } from 'physics-engine';
import { extent, prepareCanvas, useCanvasSize, usePrefersReducedMotion } from '../../lib/canvas';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { PlaybackControls } from './PlaybackControls';

interface SimulationCanvasProps {
  samples: MotionSample[];
  isProjectile?: boolean;
  highlightTime?: number;
  onTimeChange?: (t: number) => void;
  flightTime?: number;
}

const ASPECT_RATIO = 500 / 280;

function indexAtTime(samples: MotionSample[], time: number): number {
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (samples[mid]!.t <= time) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function SimulationCanvas({
  samples,
  isProjectile = false,
  highlightTime,
  onTimeChange,
  flightTime,
}: SimulationCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useCanvasSize(wrapperRef, ASPECT_RATIO);
  const reducedMotion = usePrefersReducedMotion();

  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const duration = samples.length > 0 ? samples[samples.length - 1]!.t : 0;
  const activeTime = highlightTime ?? time;
  const sample = samples.length > 0 ? samples[indexAtTime(samples, activeTime)] : undefined;

  const bounds = useMemo(() => {
    const ys = extent(samples.map((s) => s.y));
    const xs = isProjectile ? extent(samples.map((s) => s.x)) : { min: 0, max: 1 };
    return {
      minX: xs.min,
      maxX: Math.max(xs.max, xs.min + 1),
      minY: 0,
      maxY: Math.max(ys.max, 1),
    };
  }, [samples, isProjectile]);

  useEffect(() => {
    if (!playing || duration <= 0 || reducedMotion) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setTime((current) => {
        const next = current + dt;
        if (next >= duration) {
          setPlaying(false);
          onTimeChange?.(duration);
          return duration;
        }
        onTimeChange?.(next);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, speed, reducedMotion, onTimeChange]);

  const scrubBy = (delta: number) => {
    setPlaying(false);
    setTime((current) => {
      const next = Math.min(Math.max(current + delta, 0), duration);
      onTimeChange?.(next);
      return next;
    });
  };

  useKeyboardShortcuts(
    {
      ' ': () => setPlaying((p) => !p),
      ArrowRight: () => scrubBy(duration / 100),
      ArrowLeft: () => scrubBy(-duration / 100),
      Home: () => {
        setPlaying(false);
        setTime(0);
        onTimeChange?.(0);
      },
      End: () => {
        setPlaying(false);
        setTime(duration);
        onTimeChange?.(duration);
      },
    },
    samples.length > 0,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || samples.length === 0) return;
    const frame = prepareCanvas(canvas, width, height);
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;

    const pad = 30;
    const spanX = bounds.maxX - bounds.minX || 1;
    const spanY = bounds.maxY - bounds.minY || 1;
    const toX = (x: number) => pad + ((x - bounds.minX) / spanX) * (w - 2 * pad);
    const toY = (y: number) => h - pad - ((y - bounds.minY) / spanY) * (h - 2 * pad);

    const styles = getComputedStyle(document.documentElement);
    const borderColor = styles.getPropertyValue('--border').trim() || '#2d3a4f';
    const accentColor = styles.getPropertyValue('--accent').trim() || '#4da3ff';
    const givenColor = styles.getPropertyValue('--given').trim() || '#f0b429';
    const solveColor = styles.getPropertyValue('--solve').trim() || '#3dd68c';
    const mutedColor = styles.getPropertyValue('--text-muted').trim() || '#8b9cb3';

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(w - pad, toY(0));
    ctx.stroke();

    ctx.fillStyle = mutedColor;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    for (const fraction of [0, 0.5, 1]) {
      const value = bounds.minY + fraction * spanY;
      const y = toY(value);
      ctx.fillText(`${formatNumber(value, 1)} m`, 4, y - 2);
      ctx.strokeStyle = borderColor;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]!;
      const px = isProjectile ? toX(s.x) : w / 2;
      const py = toY(s.y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (sample) {
      const px = isProjectile ? toX(sample.x) : w / 2;
      const py = toY(sample.y);
      ctx.fillStyle = givenColor;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();

      if (isProjectile) {
        const scale = 0.3;
        ctx.strokeStyle = solveColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + sample.vx * scale, py - sample.vy * scale);
        ctx.stroke();
      }
    }
  }, [samples, sample, isProjectile, width, height, bounds]);

  if (samples.length === 0) {
    return <p className="muted">Run a valid scenario to see the simulation.</p>;
  }

  return (
    <div ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={
          isProjectile
            ? `Projectile path, range ${formatNumber(bounds.maxX, 1)} metres, apex ${formatNumber(bounds.maxY, 1)} metres`
            : `Vertical motion path, apex ${formatNumber(bounds.maxY, 1)} metres`
        }
        style={{ display: 'block', margin: '0 auto' }}
      />
      {sample && (
        <div className="muted" style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
          t = {formatNumber(sample.t)} s · y = {formatNumber(sample.y)} m
          {isProjectile && ` · x = ${formatNumber(sample.x)} m`}
          {' · '}Ek = {formatNumber(sample.kineticEnergy)} J · Ep = {formatNumber(sample.potentialEnergy)} J
          {flightTime !== undefined && sample.t >= flightTime - 0.01 && (
            <span style={{ color: 'var(--danger)' }}> · Impact</span>
          )}
        </div>
      )}
      {reducedMotion && (
        <p className="muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          Animation is disabled because your system requests reduced motion. Use the slider to scrub.
        </p>
      )}
      <PlaybackControls
        playing={playing}
        time={activeTime}
        duration={duration}
        speed={speed}
        onSpeedChange={setSpeed}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onRestart={() => {
          setTime(0);
          setPlaying(false);
          onTimeChange?.(0);
        }}
        onScrub={(next) => {
          setTime(next);
          setPlaying(false);
          onTimeChange?.(next);
        }}
      />
      <p className="muted" style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.25rem' }}>
        Space to play or pause · ← → to scrub · Home / End to jump
      </p>
    </div>
  );
}
