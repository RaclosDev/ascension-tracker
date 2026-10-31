import { describe, it, expect } from 'vitest';
import { capitalizeFirst } from './dateHelper';

describe('capitalizeFirst', () => {
  it('uppercases only the first letter of a Spanish date', () => {
    expect(capitalizeFirst('viernes, 30 de octubre de 2026')).toBe(
      'Viernes, 30 de octubre de 2026',
    );
    expect(capitalizeFirst('jue 30 oct')).toBe('Jue 30 oct');
  });

  it('leaves an already capitalized label and an empty string unchanged', () => {
    expect(capitalizeFirst('Viernes, 30 de octubre de 2026')).toBe(
      'Viernes, 30 de octubre de 2026',
    );
    expect(capitalizeFirst('')).toBe('');
  });
});
