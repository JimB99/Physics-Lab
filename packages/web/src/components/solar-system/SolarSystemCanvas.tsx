import { useEffect, useRef } from 'react';
import type { PlanetPosition } from 'physics-engine';

interface SolarSystemCanvasProps {
  positions: PlanetPosition[];
  title: string;
  scaleMode: 'true' | 'schematic';
}

export function SolarSystemCanvas({ positions, title, scaleMode }: SolarSystemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const pad = 36;
    const planets = positions.filter((p) => p.id !== 'sun');
    const xs = planets.map((p) => p.displayX);
    const ys = planets.map((p) => p.displayY);
    const maxOrbit = Math.max(...planets.map((p) => p.orbitDisplayRadius), 0.01);
    const minX = Math.min(...xs, -maxOrbit);
    const maxX = Math.max(...xs, maxOrbit);
    const minY = Math.min(...ys, -maxOrbit);
    const maxY = Math.max(...ys, maxOrbit);

    const span = Math.max(maxX - minX, maxY - minY, 0.01);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const scale = (Math.min(w, h) - 2 * pad) / span;

    const toCanvas = (x: number, y: number) => ({
      x: w / 2 + (x - cx) * scale,
      y: h / 2 - (y - cy) * scale,
    });

    ctx.fillStyle = '#8b9cb3';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 18);
    ctx.textAlign = 'left';
    ctx.fillText(scaleMode === 'true' ? 'True ecliptic scale (AU)' : 'Schematic spacing', pad, h - 12);

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
  }, [positions, title, scaleMode]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={560}
      style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }}
      aria-label={title}
    />
  );
}
