export interface ViewTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 40;

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function identityView(): ViewTransform {
  return { zoom: 1, panX: 0, panY: 0 };
}

/** Zoom about a canvas-space point so that point stays under the cursor. */
export function zoomAt(
  view: ViewTransform,
  canvasX: number,
  canvasY: number,
  originX: number,
  originY: number,
  factor: number,
): ViewTransform {
  const nextZoom = clampZoom(view.zoom * factor);
  const applied = nextZoom / view.zoom;
  return {
    zoom: nextZoom,
    panX: (canvasX - originX) * (1 - applied) + view.panX * applied,
    panY: (canvasY - originY) * (1 - applied) + view.panY * applied,
  };
}

export function panBy(view: ViewTransform, dx: number, dy: number): ViewTransform {
  return { ...view, panX: view.panX + dx, panY: view.panY + dy };
}

export function projectPoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  scale: number,
  width: number,
  height: number,
  view: ViewTransform,
): { x: number; y: number } {
  const originX = width / 2;
  const originY = height / 2;
  return {
    x: originX + view.panX + (x - cx) * scale * view.zoom,
    y: originY + view.panY - (y - cy) * scale * view.zoom,
  };
}
