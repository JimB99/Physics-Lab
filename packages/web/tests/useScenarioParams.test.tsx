import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { useScenarioParams } from '../src/hooks/useScenarioParams';
import { VERTICAL_DEFAULT_MODES, resolveFieldModes } from '../src/lib/fieldModes';

const defaults = {
  h0: 10,
  v0: 0,
  t: 1,
  y: 5,
  v: -5,
  impactTime: 0,
  planet: 'earth',
  customG: 9.80665,
  mass: 1,
};

function Probe() {
  const [, urlModes] = useScenarioParams(defaults);
  const modes = resolveFieldModes(VERTICAL_DEFAULT_MODES, urlModes);
  const [search] = useSearchParams();
  return (
    <div>
      <span data-testid="y-mode">{modes.y}</span>
      <span data-testid="h0-mode">{modes.h0}</span>
      <span data-testid="url-y">{String(urlModes.y ?? '')}</span>
      <span data-testid="query">{search.toString()}</span>
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

describe('useScenarioParams field modes', () => {
  it('does not treat omitted modes as Given', () => {
    renderProbe('/motion/free-fall');
    expect(screen.getByTestId('url-y').textContent).toBe('');
    expect(screen.getByTestId('y-mode').textContent).toBe('solve');
    expect(screen.getByTestId('h0-mode').textContent).toBe('given');
  });

  it('honours an explicit solve flag from a preset query', () => {
    renderProbe('/motion/free-fall?h0=330&h0_mode=given&v0=0&v0_mode=given&impactTime_mode=solve');
    expect(screen.getByTestId('y-mode').textContent).toBe('solve');
    expect(screen.getByTestId('h0-mode').textContent).toBe('given');
  });
});
