import type { ReactNode } from 'react';

const one = (n: number | null | undefined) => (Number(n) || 0).toFixed(1).replace('.', ',');

interface Props {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Text after "kcal", e.g. "/ 100 g". */
  per?: ReactNode;
  className?: string;
}

/** Calories and the three macros on one line, always in the same order and wording. */
export function MacroLine({ kcal, protein, carbs, fat, per, className }: Props) {
  return (
    <span className={`macro-line tabular-nums${className ? ` ${className}` : ''}`}>
      <span className="macro-line-kcal">
        <strong>{Math.round(Number(kcal) || 0)}</strong> kcal{per ? <> {per}</> : null}
      </span>
      <span data-macro="protein">
        <abbr title="Proteína">P</abbr> {one(protein)} g
      </span>
      <span data-macro="carbs">
        <abbr title="Hidratos">H</abbr> {one(carbs)} g
      </span>
      <span data-macro="fat">
        <abbr title="Grasa">G</abbr> {one(fat)} g
      </span>
    </span>
  );
}
