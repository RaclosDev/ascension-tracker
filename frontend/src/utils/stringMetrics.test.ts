import { describe, it, expect } from 'vitest';
import { levenshtein, calculateMergeMatchScore } from './stringMetrics';

describe('stringMetrics - levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('', '')).toBe(0);
    expect(levenshtein('press banca', 'press banca')).toBe(0);
    expect(levenshtein('sentadilla', 'sentadilla')).toBe(0);
  });

  it('handles empty strings correctly', () => {
    expect(levenshtein('', 'banca')).toBe(5);
    expect(levenshtein('banca', '')).toBe(5);
  });

  it('calculates single character insertions, deletions, and substitutions', () => {
    // Insertion
    expect(levenshtein('press', 'presss')).toBe(1);
    // Deletion
    expect(levenshtein('press', 'pres')).toBe(1);
    // Substitution
    expect(levenshtein('press', 'presh')).toBe(1);
  });

  it('calculates multi-character differences accurately', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('curl bíceps', 'curl triceps')).toBe(3);
  });

  it('handles strings with accents and diacritics', () => {
    expect(levenshtein('bíceps', 'biceps')).toBe(1);
    expect(levenshtein('jalón al pecho', 'jalon al pecho')).toBe(1);
    expect(levenshtein('extensión', 'extensión')).toBe(0);
  });
});

describe('stringMetrics - calculateMergeMatchScore', () => {
  const baseParams = {
    sourceName: 'Press Banca Barra',
    sourceMuscle: 'pecho',
    sourceEquipment: 'barra',
    targetName: 'Press Banca con Barra',
    targetMuscle: 'pecho',
    targetEquipment: 'barra',
    sourceTokens: ['press', 'banca', 'barra'],
    isSearchingOrFiltering: false,
  };

  it('awards base points for matching muscle (+50) and matching equipment (+20)', () => {
    const score = calculateMergeMatchScore(baseParams);
    // Muscle (50) + Equip (20) + 3 tokens * 5 (15) - dist("press banca barra", "press banca con barra") * 0.1
    // dist is 4 ("con ") -> -0.4 -> 85 - 0.4 = 84.6
    expect(score).toBeGreaterThan(80);
  });

  it('deducts points when muscle or equipment do not match', () => {
    const sameScore = calculateMergeMatchScore(baseParams);
    const diffMuscleScore = calculateMergeMatchScore({
      ...baseParams,
      targetMuscle: 'espalda',
    });
    const diffEquipScore = calculateMergeMatchScore({
      ...baseParams,
      targetEquipment: 'mancuernas',
    });

    expect(diffMuscleScore).toBeCloseTo(sameScore - 50, 1);
    expect(diffEquipScore).toBeCloseTo(sameScore - 20, 1);
  });

  it('adds 1000 points when isSearchingOrFiltering is true', () => {
    const normalScore = calculateMergeMatchScore(baseParams);
    const filteredScore = calculateMergeMatchScore({
      ...baseParams,
      isSearchingOrFiltering: true,
    });

    expect(filteredScore).toBeCloseTo(normalScore + 1000, 1);
  });

  it('penalizes higher levenshtein distance between names', () => {
    const closeTarget = calculateMergeMatchScore({
      ...baseParams,
      targetName: 'Press Banca Barra',
    });
    const farTarget = calculateMergeMatchScore({
      ...baseParams,
      targetName: 'Aperturas Inclinadas Pecho',
    });

    expect(closeTarget).toBeGreaterThan(farTarget);
  });
});
