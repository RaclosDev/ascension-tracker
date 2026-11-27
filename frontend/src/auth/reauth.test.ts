import { describe, expect, it } from 'vitest';
import { reauthMessage } from './reauth';

const failure = (status: number, error?: string) => ({
  response: { status, data: error ? { error } : {} },
});

describe('reauthMessage', () => {
  it('uses the server message for a wrong proof and for too many attempts', () => {
    expect(reauthMessage(failure(403, 'No hemos podido confirmar.'))).toBe(
      'No hemos podido confirmar.',
    );
    expect(reauthMessage(failure(429, 'Demasiados intentos.'))).toBe('Demasiados intentos.');
  });

  it('falls back to its own text when the answer has none', () => {
    expect(reauthMessage(failure(403))).toContain('confirmar tu identidad');
    expect(reauthMessage(failure(429))).toContain('Demasiados intentos');
  });

  it('leaves any other error to the caller', () => {
    expect(reauthMessage(failure(500, 'Error'))).toBeNull();
    expect(reauthMessage(new Error('red'))).toBeNull();
    expect(reauthMessage(null)).toBeNull();
  });
});
