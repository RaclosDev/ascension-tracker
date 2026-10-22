import { describe, it, expect } from 'vitest';
import { getBasePortion, isFoodRegistered } from './nutritionHelpers';

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

describe('nutritionHelpers - isFoodRegistered', () => {
  const savedFoods = [
    { name: 'Pan', brand: 'Dia' },
    { name: 'Leche Desnatada', brand: 'President' },
    { name: 'Pececitos salados galletitas', brand: 'Gullón' },
    { name: '+proteina natural', brand: 'Hacendado' },
    { name: 'filete ternera', brand: '' },
    { name: 'Arroz Integral (SOS)', brand: '' },
    { name: 'Huevo cocido', brand: 'Genérico' },
  ];

  const recipes = [{ name: 'Tortilla de patatas fitness' }, { name: 'Batido de avena y plátano' }];

  it('retorna false para valores nulos, vacíos o indefinidos', () => {
    expect(isFoodRegistered(null, savedFoods, recipes)).toBe(false);
    expect(isFoodRegistered(undefined, savedFoods, recipes)).toBe(false);
    expect(isFoodRegistered('', savedFoods, recipes)).toBe(false);
    expect(isFoodRegistered('   ', savedFoods, recipes)).toBe(false);
  });

  it('detecta alimentos guardados con formato "Nombre (Marca)" cuando están separados', () => {
    expect(isFoodRegistered('Pan (Dia)', savedFoods, recipes)).toBe(true);
    expect(isFoodRegistered('Leche Desnatada (President)', savedFoods, recipes)).toBe(true);
    expect(isFoodRegistered('+proteina natural (Hacendado)', savedFoods, recipes)).toBe(true);
  });

  it('maneja mayúsculas, minúsculas y tildes correctamente', () => {
    // Gullón con o sin tilde y variaciones de caja
    expect(isFoodRegistered('Pececitos salados galletitas (Gullon)', savedFoods, recipes)).toBe(
      true,
    );
    expect(isFoodRegistered('PECECITOS SALADOS GALLETITAS (GULLÓN)', savedFoods, recipes)).toBe(
      true,
    );
    expect(isFoodRegistered('pan (dia)', savedFoods, recipes)).toBe(true);
  });

  it('detecta alimentos guardados por nombre simple sin marca', () => {
    expect(isFoodRegistered('filete ternera', savedFoods, recipes)).toBe(true);
    expect(isFoodRegistered('Filete Ternera', savedFoods, recipes)).toBe(true);
  });

  it('detecta alimentos cuyo nombre ya guardaba la marca directamente', () => {
    expect(isFoodRegistered('Arroz Integral (SOS)', savedFoods, recipes)).toBe(true);
  });

  it('detecta alimentos con marca genérica', () => {
    expect(isFoodRegistered('Huevo cocido', savedFoods, recipes)).toBe(true);
  });

  it('detecta coincidencias con recetas guardadas', () => {
    expect(isFoodRegistered('Tortilla de patatas fitness', savedFoods, recipes)).toBe(true);
    expect(isFoodRegistered('Batido de avena y platano', savedFoods, recipes)).toBe(true);
  });

  it('retorna false si el alimento no está registrado o la marca no coincide', () => {
    expect(isFoodRegistered('Pan (Mercadona)', savedFoods, recipes)).toBe(false);
    expect(isFoodRegistered('Salmon a la plancha', savedFoods, recipes)).toBe(false);
    expect(isFoodRegistered('Pizza barbacoa', savedFoods, recipes)).toBe(false);
  });
});
