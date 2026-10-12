import { describe, it, expect } from 'vitest';
import { getBasePortion } from './nutritionHelpers';

describe('nutritionHelpers - getBasePortion', () => {
  it('retorna null para null, undefined o string vacío', () => {
    expect(getBasePortion(null)).toBeNull();
    expect(getBasePortion('')).toBeNull();
  });

  it('retorna null para JSON inválido o estructura no-array', () => {
    expect(getBasePortion('{ "invalido": true }')).toBeNull();
    expect(getBasePortion('not a json')).toBeNull();
    expect(getBasePortion('[]')).toBeNull();
  });

  it('retorna null si las porciones tienen amount <= 0 o inválido', () => {
    const jsonZero = JSON.stringify([{ label: '1 unidad', amount: 0 }]);
    expect(getBasePortion(jsonZero)).toBeNull();

    const jsonNeg = JSON.stringify([{ label: 'taza', amount: -50 }]);
    expect(getBasePortion(jsonNeg)).toBeNull();

    const jsonNoAmount = JSON.stringify([{ label: 'pieza' }]);
    expect(getBasePortion(jsonNoAmount)).toBeNull();
  });

  it('encuentra la porción base que empieza con "1 " y remueve el prefijo', () => {
    const json = JSON.stringify([
      { label: '100g', amount: 100 },
      { label: '1 rebanada', amount: 30 },
      { label: '2 rebanadas', amount: 60 },
    ]);
    const base = getBasePortion(json);
    expect(base).toEqual({ label: 'rebanada', amount: 30 });
  });

  it('si ninguna porción empieza por "1 ", retorna la primera porción válida del array', () => {
    const json = JSON.stringify([
      { label: 'vaso mediano', amount: 250 },
      { label: 'jarra', amount: 1000 },
    ]);
    const base = getBasePortion(json);
    expect(base).toEqual({ label: 'vaso mediano', amount: 250 });
  });
});
