import { describe, expect, it } from 'vitest';
import { needsConsentScreen, type ConsentStatus } from './consents';

const answer = (granted: boolean, version = 'v2') => ({
  granted,
  version,
  at: '2026-11-05T00:00:00Z',
});

describe('needsConsentScreen', () => {
  it('asks a new user', () => {
    expect(needsConsentScreen({ version: 'v2', consents: {} })).toBe(true);
  });

  it('accepts a "no" to health data and AI as an answer', () => {
    const status: ConsentStatus = {
      version: 'v2',
      consents: {
        TERMS: answer(true),
        PRIVACY: answer(true),
        HEALTH_DATA: answer(false),
        AI_HEALTH: answer(false),
      },
    };
    expect(needsConsentScreen(status)).toBe(false);
  });

  it('asks again when the legal texts change', () => {
    const status: ConsentStatus = {
      version: 'v3',
      consents: {
        TERMS: answer(true),
        PRIVACY: answer(true),
        HEALTH_DATA: answer(true),
        AI_HEALTH: answer(true),
      },
    };
    expect(needsConsentScreen(status)).toBe(true);
  });
});
