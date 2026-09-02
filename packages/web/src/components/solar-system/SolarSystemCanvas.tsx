import { useEffect, useRef, useState } from 'react';
import type { AlignmentGuide, DisplayScaleMode, PlanetPosition } from 'physics-engine';
import { extent, prepareCanvas, useCanvasSize } from '../../lib/canvas';
import { identityView, panBy, projectPoint, zoomAt, type ViewTransform } from '../../lib/viewTransform';

interface SolarSystemCanvasProps {
  positions: PlanetPosition[];
  title: string;
  scaleMode: DisplayScaleMode;
  guide?: AlignmentGuide | null;
}

export function SolarSystemCanvas({ positions, title, scaleMode, guide }: SolarSystemCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectionRef = useRef<{
    toCanvas: (x: number, y: number) => { x: number; y: number };
  } | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState<PlanetPosition | null>(null);
  const [view, setView] = useState<ViewTransform>(identityView);
  const { width, height } = useCanvasSize(wrapperRef, 1);

  useEffect(() => {
    setView(identityView());
  }, [scaleMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      setView((current) =>
        zoomAt(
          current,
          event.clientX - rect.left,
          event.clientY - rect.top,
          width / 2,
          height / 2,
          factor,
        ),
      );
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [width, height]);

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

    const toCanvas = (x: number, y: number) => projectPoint(x, y, cx, cy, scale, w, h, view);

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
      const orbitR = planet.orbitDisplayRadius * scale * view.zoom;
      ctx.strokeStyle = '#2d3a4f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center.x, center.y, orbitR, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (guide?.kind === 'line') {
      const reach = span * 0.75;
      const a = toCanvas(
        guide.originX - guide.directionX * reach,
        guide.originY - guide.directionY * reach,
      );
      const b = toCanvas(
        guide.originX + guide.directionX * reach,
        guide.originY + guide.directionY * reach,
      );
      ctx.strokeStyle = 'rgba(240, 180, 41, 0.7)';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (guide?.kind === 'axis') {
      const angle = (guide.longitudeDeg * Math.PI) / 180;
      const reach = maxOrbit * 1.15;
      const a = toCanvas(-reach * Math.cos(angle), -reach * Math.sin(angle));
      const b = toCanvas(reach * Math.cos(angle), reach * Math.sin(angle));
      ctx.strokeStyle = 'rgba(77, 163, 255, 0.7)';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
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
  }, [positions, title, scaleMode, width, height, hovered, view, guide]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        role="img"
        style={{ display: 'block', width: '100%', cursor: dragRef.current ? 'grabbing' : 'grab' }}
        aria-label={`Solar system positions on ${title}. Scroll to zoom, drag to pan.`}
        onDoubleClick={() => setView(identityView())}
        onPointerDown={(event) => {
          dragRef.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerLeave={() => {
          dragRef.current = null;
          setHovered(null);
        }}
        onPointerMove={(event) => {
          if (dragRef.current) {
            const dx = event.clientX - dragRef.current.x;
            const dy = event.clientY - dragRef.current.y;
            dragRef.current = { x: event.clientX, y: event.clientY };
            setView((current) => panBy(current, dx, dy));
            return;
          }
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
      <div className="zoom-bar">
        <button type="button" onClick={() => setView((current) => zoomAt(current, width / 2, height / 2, width / 2, height / 2, 1.25))}>
          Zoom in
        </button>
        <button type="button" onClick={() => setView((current) => zoomAt(current, width / 2, height / 2, width / 2, height / 2, 0.8))}>
          Zoom out
        </button>
        <button type="button" onClick={() => setView(identityView())}>
          Reset view
        </button>
      </div>
      <p className="muted" style={{ textAlign: 'center', fontSize: '0.8rem', minHeight: '1.4em', margin: '0.35rem 0 0' }}>
        {hovered
          ? `${hovered.name}: λ = ${hovered.longitudeDeg.toFixed(1)}°, r = ${hovered.distanceAu.toFixed(3)} AU`
          : 'Scroll to zoom · drag to pan · hover a planet for λ and r'}
      </p>
    </div>
  );
}
