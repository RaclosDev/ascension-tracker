import { useState, type InputHTMLAttributes } from 'react';

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

type Props<E extends number | null> = NativeProps & {
  value: number | null | undefined;
  /** Called with each number the user types, and with `emptyValue` when the field is cleared. */
  onValueChange: (value: number | E) => void;
  /**
   * What an empty field means. Without it, clearing the field is only a step while typing: the
   * last number stays and comes back on blur.
   */
  emptyValue?: E;
  type?: 'number' | 'text';
};

const toText = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(value) ? '' : String(value);

const toNumber = (text: string) => {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '' || trimmed === '-' || trimmed === '.') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

/**
 * A number field that can be emptied while typing. A plain controlled input that turns its text
 * into a number on every key cannot: clearing "79,2" gives 0 or the old value back at once.
 * Here the text is the field's own; the number goes up only when there is one.
 */
export function NumberInput<E extends number | null = never>({
  value,
  onValueChange,
  emptyValue,
  type = 'number',
  onBlur,
  ...rest
}: Props<E>) {
  const [text, setText] = useState(() => toText(value));
  const [seen, setSeen] = useState(value);
  // A value set from outside (a +0,1 button, a reset) replaces what is typed.
  if (!Object.is(value, seen)) {
    setSeen(value);
    if (toNumber(text) !== value) setText(toText(value));
  }
  return (
    <input
      {...rest}
      type={type}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        const n = toNumber(next);
        if (n !== null) {
          setSeen(n);
          onValueChange(n);
        } else if (next.trim() === '' && emptyValue !== undefined) {
          setSeen(emptyValue);
          onValueChange(emptyValue);
        }
      }}
      onBlur={(e) => {
        if (toNumber(text) === null && !(text.trim() === '' && emptyValue !== undefined))
          setText(toText(value));
        onBlur?.(e);
      }}
    />
  );
}
