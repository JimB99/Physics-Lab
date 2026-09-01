import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useCompareParams } from '../src/hooks/useCompareParams';
import { decodeVariant, encodeVariant, nextVariantId, DEFAULT_VARIANTS } from '../src/lib/compareDefaults';

function Probe() {
  const [params, setParams] = useCompareParams();
  return (
    <div>
      <span data-testid="scenario">{params.scenario}</span>
      <span data-testid="type">{params.compareType}</span>
      <span data-testid="count">{params.variants.length}</span>
      <span data-testid="planets">{params.variants.map((v) => v.planet).join(',')}</span>
      <span data-testid="angles">{params.variants.map((v) => v.angle).join(',')}</span>
      <button type="button" onClick={() => setParams({ scenario: 'projectile', compareType: 'angle' })}>
        set
      </button>
    </div>
  );
}

describe('compare variant codec', () => {
  it('round-trips a variant', () => {
    const original = DEFAULT_VARIANTS[0]!;
    const decoded = decodeVariant('a', encodeVariant(original), original.color);
    expect(decoded).not.toBeNull();
    expect(decoded!.planet).toBe(original.planet);
    expect(decoded!.h0).toBe(original.h0);
    expect(decoded!.dragEnabled).toBe(original.dragEnabled);
  });

  it('rejects malformed input', () => {
    expect(decodeVariant('a', 'nonsense', '#fff')).toBeNull();
    expect(decodeVariant('a', 'pluto:9.8:1:1:1:0', '#fff')).toBeNull();
  });

  it('never reuses an existing id', () => {
    expect(nextVariantId([{ ...DEFAULT_VARIANTS[1]!, id: 'b' }])).toBe('a');
    expect(nextVariantId(DEFAULT_VARIANTS)).toBe('c');
  });
});

describe('useCompareParams', () => {
  it('defaults to two variants', () => {
    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Probe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('scenario').textContent).toBe('vertical1d');
  });

  it('reads variants from the URL', () => {
    render(
      <MemoryRouter
        initialEntries={['/compare?scenario=projectile&type=angle&v=earth:9.80665:0:20:30:0&v=earth:9.80665:0:20:60:0']}
      >
        <Probe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('angles').textContent).toBe('30,60');
    expect(screen.getByTestId('type').textContent).toBe('angle');
  });

  it('writes changes back to the URL', async () => {
    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Probe />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'set' }));
    expect(screen.getByTestId('scenario').textContent).toBe('projectile');
    expect(screen.getByTestId('type').textContent).toBe('angle');
  });
});
