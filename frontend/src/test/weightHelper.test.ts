import { expect, test, describe } from 'vitest';
import { parseSafeWeight } from '../utils/weightHelper';

describe('weightHelper', () => {
    test('parseSafeWeight formats weight correctly', () => {
        expect(parseSafeWeight('70.52')).toBe(70.52);
        expect(parseSafeWeight('70,5')).toBe(70.5);
    });

    test('parseSafeWeight handles undefined/null', () => {
        expect(parseSafeWeight(undefined)).toBe(null);
        expect(parseSafeWeight(null)).toBe(null);
    });
});




