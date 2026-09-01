import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { usePlanetCalendarParams } from '../src/hooks/usePlanetCalendarParams';

function Probe() {
  const [params, setParams] = usePlanetCalendarParams();
  const [search] = useSearchParams();
  return (
    <div>
      <span data-testid="scale">{params.scaleMode}</span>
      <span data-testid="metric">{params.alignmentMetric}</span>
      <span data-testid="pairA">{params.pairA}</span>
      <span data-testid="query">{search.toString()}</span>
      <button
        type="button"
        onClick={() => setParams({ scaleMode: 'true', alignmentMetric: 'maxPairwise' })}
      >
        set
      </button>
    </div>
  );
}

function renderProbe(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Probe />
    </MemoryRouter>,
  );
}

describe('usePlanetCalendarParams', () => {
  it('round-trips the display scale that setParams wrote', async () => {
    renderProbe('/solar-system/planet-calendar');
    expect(screen.getByTestId('scale').textContent).toBe('schematic');

    await userEvent.click(screen.getByRole('button', { name: 'set' }));

    expect(screen.getByTestId('scale').textContent).toBe('true');
    expect(screen.getByTestId('metric').textContent).toBe('maxPairwise');
  });

  it('reads the short query keys', () => {
    renderProbe('/solar-system/planet-calendar?scale=true&metric=chainByLongitude');
    expect(screen.getByTestId('scale').textContent).toBe('true');
    expect(screen.getByTestId('metric').textContent).toBe('chainByLongitude');
  });

  it('falls back to a valid planet when pairA is garbage', () => {
    renderProbe('/solar-system/planet-calendar?pairA=banana');
    expect(screen.getByTestId('pairA').textContent).toBe('mars');
  });
});
