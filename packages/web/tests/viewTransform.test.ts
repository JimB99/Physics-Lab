import { describe, expect, it } from 'vitest';
import { identityView, panBy, projectPoint, zoomAt } from '../src/lib/viewTransform';

describe('viewTransform', () => {
  it('keeps the world point under the cursor fixed when zooming', () => {
    const view = { zoom: 1, panX: 10, panY: -4 };
    const width = 500;
    const height = 500;
    const originX = width / 2;
    const originY = height / 2;
    const cursorX = 400;
    const cursorY = 200;
    const scale = 1;
    const cx = 0;
    const cy = 0;
    const worldX = cx + (cursorX - originX - view.panX) / (scale * view.zoom);
    const worldY = cy - (cursorY - originY - view.panY) / (scale * view.zoom);

    const zoomed = zoomAt(view, cursorX, cursorY, originX, originY, 2);
    const after = projectPoint(worldX, worldY, cx, cy, scale, width, height, zoomed);

    expect(zoomed.zoom).toBe(2);
    expect(after.x).toBeCloseTo(cursorX, 8);
    expect(after.y).toBeCloseTo(cursorY, 8);
  });

  it('clamps zoom to the allowed range', () => {
    const exploded = zoomAt(identityView(), 0, 0, 0, 0, 1e9);
    expect(exploded.zoom).toBe(40);
    const collapsed = zoomAt(identityView(), 0, 0, 0, 0, 0.001);
    expect(collapsed.zoom).toBe(0.5);
  });

  it('pans in canvas pixels', () => {
    const next = panBy(identityView(), 12, -8);
    expect(next.panX).toBe(12);
    expect(next.panY).toBe(-8);
    expect(next.zoom).toBe(1);
  });
});
