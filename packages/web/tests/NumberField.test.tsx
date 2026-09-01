import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberField } from '../src/components/inputs/NumberField';

describe('NumberField', () => {
  it('lets the user type a decimal value', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Initial height" value={10} onChange={onChange} />);
    const input = screen.getByLabelText('Initial height') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.type(input, '1.5');

    expect(input.value).toBe('1.5');
    expect(onChange).toHaveBeenLastCalledWith(1.5);
  });

  it('lets the user type a negative value', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Initial velocity" value={0} onChange={onChange} />);
    const input = screen.getByLabelText('Initial velocity') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.type(input, '-4.25');

    expect(input.value).toBe('-4.25');
    expect(onChange).toHaveBeenLastCalledWith(-4.25);
  });

  it('does not emit a value while the text is not a number yet', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Mass" value={1} onChange={onChange} />);
    const input = screen.getByLabelText('Mass') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.type(input, '-');

    expect(input.value).toBe('-');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('restores the prop value when the field is left empty', async () => {
    render(<NumberField label="Mass" value={2.5} onChange={() => {}} />);
    const input = screen.getByLabelText('Mass') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.tab();

    expect(input.value).toBe('2.5');
  });

  it('clamps to min on blur', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Mass" value={1} min={0.001} onChange={onChange} />);
    const input = screen.getByLabelText('Mass') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.type(input, '-5');
    await userEvent.tab();

    expect(onChange).toHaveBeenLastCalledWith(0.001);
  });

  it('re-syncs when the prop changes from outside', () => {
    const { rerender } = render(<NumberField label="Mass" value={1} onChange={() => {}} />);
    rerender(<NumberField label="Mass" value={42} onChange={() => {}} />);
    expect((screen.getByLabelText('Mass') as HTMLInputElement).value).toBe('42');
  });
});
