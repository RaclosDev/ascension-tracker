import { describe, it, expect } from 'vitest';
import {
  parseCsvRows,
  parseHevyDate,
  parseSetType,
  inferExerciseMetadata,
  parseHevyCsv,
} from './import';
import { Exercise } from './types';

describe('parseCsvRows', () => {
  it('parses basic CSV lines correctly', () => {
    const csv = 'title,weight,reps\nBench,100,5\nSquat,140,3';
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ['title', 'weight', 'reps'],
      ['Bench', '100', '5'],
      ['Squat', '140', '3'],
    ]);
  });

  it('handles quotes with commas inside cells', () => {
    const csv = 'title,date,notes\n"Torso, pecho","12 ene 2024, 18:30","Buena sesión, con ganas"';
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ['title', 'date', 'notes'],
      ['Torso, pecho', '12 ene 2024, 18:30', 'Buena sesión, con ganas'],
    ]);
  });

  it('handles escaped quotes inside quoted cells', () => {
    const csv = 'title,description\nBench,"Press con ""pausa"""';
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ['title', 'description'],
      ['Bench', 'Press con "pausa"'],
    ]);
  });

  it('handles CRLF line endings without trailing empty rows', () => {
    const csv = 'a,b\r\n1,2\r\n3,4\r\n\r\n';
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });
});

describe('parseHevyDate', () => {
  it.each([
    '',
    'not a date',
    '12 invented 2024, 18:00',
    '31 feb 2024, 18:00',
    '2024-02-31 18:00:00',
  ])('rejects invalid dates instead of silently assigning today: %s', (value) => {
    expect(() => parseHevyDate(value)).toThrow(/fecha/i);
  });
  it('parses Spanish month formats correctly', () => {
    const ts = parseHevyDate('12 ene 2024, 18:30');
    const d = new Date(ts);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(0); // enero
    expect(d.getDate()).toBe(12);
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(30);
  });

  it('parses English month formats correctly', () => {
    const ts = parseHevyDate('15 Aug 2024, 09:15');
    const d = new Date(ts);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(7); // august
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(15);
  });

  it('parses ISO date string', () => {
    const ts = parseHevyDate('2024-05-20 10:00:00');
    const d = new Date(ts);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(4); // mayo
    expect(d.getDate()).toBe(20);
  });
});

describe('parseSetType', () => {
  it('maps various set type strings', () => {
    expect(parseSetType('warmup')).toBe('warmup');
    expect(parseSetType('WarmUp')).toBe('warmup');
    expect(parseSetType('drop')).toBe('drop');
    expect(parseSetType('dropset')).toBe('drop');
    expect(parseSetType('failure')).toBe('failure');
    expect(parseSetType('normal')).toBe('normal');
    expect(parseSetType('')).toBe('normal');
    expect(parseSetType('unknown')).toBe('normal');
  });
});

describe('inferExerciseMetadata', () => {
  it('infers equipment and muscle based on exercise name', () => {
    expect(inferExerciseMetadata('Press Banca con Barra')).toEqual({
      muscle: 'pecho',
      equipment: 'barra',
    });
    expect(inferExerciseMetadata('Sentadilla Hack Multipower')).toEqual({
      muscle: 'cuadriceps',
      equipment: 'maquina',
    });
    expect(inferExerciseMetadata('Curl de Bíceps en Polea')).toEqual({
      muscle: 'biceps',
      equipment: 'polea',
    });
    expect(inferExerciseMetadata('Elevaciones Laterales Mancuernas')).toEqual({
      muscle: 'hombros',
      equipment: 'mancuernas',
    });
  });
});

describe('parseHevyCsv', () => {
  const sampleCsv = `title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_type,weight_kg,reps,distance_km,duration_seconds,rpe
"Push Day","10 ene 2024, 18:00","10 ene 2024, 19:15","Entreno intenso","Bench Press",,"RPE alto",normal,80,10,,,8.5
"Push Day","10 ene 2024, 18:00","10 ene 2024, 19:15","Entreno intenso","Bench Press",,"RPE alto",normal,85,8,,,9
"Push Day","10 ene 2024, 18:00","10 ene 2024, 19:15","Entreno intenso","Sentadilla Hack Especial",1,,normal,100,10,,,
"Leg Day","12 ene 2024, 17:00","12 ene 2024, 18:00","Día de piernas","Sentadilla Hack Especial",,,"warmup",60,12,,,
`;

  it('groups workouts, identifies exercises and creates custom exercises when not found', () => {
    const mockCatalog: Exercise[] = [
      { id: 'bench-press', name: 'Bench Press', muscle: 'pecho', equipment: 'barra' },
    ];
    const existingCustom: Exercise[] = [];
    const result = parseHevyCsv(sampleCsv, mockCatalog, existingCustom);

    expect(result.workouts.length).toBe(2);
    expect(result.workouts[0].name).toBe('Push Day');
    expect(result.workouts[0].exercises.length).toBe(2);
    expect(result.workouts[0].exercises[0].sets.length).toBe(2);
    expect(result.workouts[0].exercises[1].sets.length).toBe(1);

    expect(result.workouts[1].name).toBe('Leg Day');
    expect(result.workouts[1].exercises.length).toBe(1);

    expect(result.totalSets).toBe(4);
    // Bench press should match catalog, while "Sentadilla Hack Especial" creates 1 new custom exercise
    expect(result.newCustomExercises.length).toBe(1);
    expect(result.newCustomExercises[0].name).toBe('Sentadilla Hack Especial');
    expect(result.newCustomExercises[0].muscle).toBe('cuadriceps');
    expect(result.newCustomExercises[0].equipment).toBe('maquina');
  });

  it('throws error if header is invalid', () => {
    expect(() => parseHevyCsv('colA,colB\n1,2')).toThrow(/Formato CSV de Hevy no reconocido/);
  });

  it('neutralizes malicious formula injection characters in workout titles and notes', () => {
    const maliciousCsv = `
"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"=CMD|'/C calc'!A1","10 ene 2024, 10:00","10 ene 2024, 11:00","+2+5+cmd","Bench Press",,"@dangerous_notes","normal",100,5,,,
`;
    const result = parseHevyCsv(
      maliciousCsv,
      [{ id: 'bench-press', name: 'Bench Press', muscle: 'pecho', equipment: 'barra' }],
      [],
    );
    expect(result.workouts.length).toBe(1);
    expect(result.workouts[0]?.name?.startsWith("'=")).toBe(true);
    expect(result.workouts[0]?.notes?.startsWith("'+")).toBe(true);
    expect(result.workouts[0]?.exercises[0]?.notes?.startsWith("'@")).toBe(true);
  });
});
