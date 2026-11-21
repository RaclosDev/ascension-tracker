import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NumberInput } from './number-input';

function Harness({ initial, emptyValue }: { initial: number; emptyValue?: 0 }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <NumberInput
        aria-label="Kilos"
        value={value}
        onValueChange={setValue}
        emptyValue={emptyValue}
      />
      <output>{value}</output>
    </>
  );
}

describe('NumberInput', () => {
  it('lets the field be emptied while typing and keeps the last number', () => {
    render(<Harness initial={79.2} />);
    const input = screen.getByLabelText('Kilos');
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue(null);
    expect(screen.getByRole('status')).toHaveTextContent('79.2');
    fireEvent.change(input, { target: { value: '8' } });
    expect(screen.getByRole('status')).toHaveTextContent('8');
  });

  it('restores the number on blur when left empty without an empty value', () => {
    render(<Harness initial={5} />);
    const input = screen.getByLabelText('Kilos');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(5);
  });

  it('reports the empty value when the field is cleared', () => {
    render(<Harness initial={100} emptyValue={0} />);
    const input = screen.getByLabelText('Kilos');
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue(null);
    expect(screen.getByRole('status')).toHaveTextContent('0');
  });
});
