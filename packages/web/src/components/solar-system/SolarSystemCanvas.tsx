import { useEffect, useRef, useState } from 'react';
import type { DisplayScaleMode, PlanetPosition } from 'physics-engine';
import { extent, prepareCanvas, useCanvasSize } from '../../lib/canvas';

interface SolarSystemCanvasProps {
  positions: PlanetPosition[];
  title: string;
  scaleMode: DisplayScaleMode;
}

export function SolarSystemCanvas({ positions, title, scaleMode }: SolarSystemCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectionRef = useRef<{ toCanvas: (x: number, y: number) => { x: number; y: number } } | null>(null);
  const [hovered, setHovered] = useState<PlanetPosition | null>(null);
  const { width, height } = useCanvasSize(wrapperRef, 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.length === 0) return;
    const frame = prepareCanvas(canvas, width, height);
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;

    const pad = 36;
    const planets = positions.filter((p) => p.id !== 'sun');
    const xs = extent(planets.map((p) => p.displayX));
    const ys = extent(planets.map((p) => p.displayY));
    const orbitRadii = extent(planets.map((p) => p.orbitDisplayRadius));
    const maxOrbit = Math.max(orbitRadii.max, 0.01);
    const minX = Math.min(xs.min, -maxOrbit);
    const maxX = Math.max(xs.max, maxOrbit);
    const minY = Math.min(ys.min, -maxOrbit);
    const maxY = Math.max(ys.max, maxOrbit);

    const span = Math.max(maxX - minX, maxY - minY, 0.01);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const scale = (Math.min(w, h) - 2 * pad) / span;

    const toCanvas = (x: number, y: number) => ({
      x: w / 2 + (x - cx) * scale,
      y: h / 2 - (y - cy) * scale,
    });

    projectionRef.current = { toCanvas };

    ctx.fillStyle = '#8b9cb3';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 18);
    ctx.textAlign = 'left';
    const scaleLabel =
      scaleMode === 'true'
        ? 'True ecliptic scale (AU)'
        : scaleMode === 'log'
          ? 'Logarithmic distance from the Sun'
          : 'Schematic spacing';
    ctx.fillText(scaleLabel, pad, h - 12);

    for (const planet of planets) {
      const center = toCanvas(0, 0);
      const orbitR = planet.orbitDisplayRadius * scale;
      ctx.strokeStyle = '#2d3a4f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center.x, center.y, orbitR, 0, Math.PI * 2);
      ctx.stroke();
    }

    const sun = positions.find((p) => p.id === 'sun');
    if (sun) {
      const { x, y } = toCanvas(sun.displayX, sun.displayY);
      ctx.fillStyle = sun.color;
      ctx.beginPath();
      ctx.arc(x, y, sun.markerSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sun.color;
      ctx.fillText(sun.name, x + 8, y - 8);
    }

    for (const planet of planets) {
      const { x, y } = toCanvas(planet.displayX, planet.displayY);
      ctx.fillStyle = planet.color;
      ctx.beginPath();
      ctx.arc(x, y, planet.markerSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = planet.color;
      ctx.fillText(planet.name, x + 8, y - 8);
    }

    if (hovered) {
      const { x, y } = toCanvas(hovered.displayX, hovered.displayY);
      ctx.strokeStyle = hovered.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, hovered.markerSize + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [positions, title, scaleMode, width, height, hovered]);

  return (
    <div ref={wrapperRef} style={{ maxWidth: 560, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        role="img"
        style={{ display: 'block', width: '100%' }}
        aria-label={`Solar system positions on ${title}`}
        onMouseLeave={() => setHovered(null)}
        onMouseMove={(event) => {
          const projection = projectionRef.current;
          const canvas = canvasRef.current;
          if (!projection || !canvas) return;
          const rect = canvas.getBoundingClientRect();
          const px = event.clientX - rect.left;
          const py = event.clientY - rect.top;
          let closest: PlanetPosition | null = null;
          let closestDistance = Number.POSITIVE_INFINITY;
          for (const planet of positions) {
            const point = projection.toCanvas(planet.displayX, planet.displayY);
            const distance = Math.hypot(point.x - px, point.y - py);
            if (distance < planet.markerSize + 8 && distance < closestDistance) {
              closest = planet;
              closestDistance = distance;
            }
          }
          setHovered(closest);
        }}
      />
      <p className="muted" style={{ textAlign: 'center', fontSize: '0.85rem', minHeight: '1.4em' }}>
        {hovered
          ? `${hovered.name}: λ = ${hovered.longitudeDeg.toFixed(1)}°, r = ${hovered.distanceAu.toFixed(3)} AU`
          : 'Hover a planet for its longitude and distance.'}
      </p>
    </div>
  );
}
