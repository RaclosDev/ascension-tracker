import { SetType, Exercise, CompletedWorkout, WorkoutSet, WorkoutExercise } from './types';
import { uid } from '@/lib/utils';
import { EXERCISE_CATALOG } from './exercises';

export const MONTH_MAP: Record<string, number> = {
  ene: 0,
  jan: 0,
  enero: 0,
  january: 0,
  feb: 1,
  febrero: 1,
  february: 1,
  mar: 2,
  marzo: 2,
  march: 2,
  abr: 3,
  apr: 3,
  abril: 3,
  april: 3,
  may: 4,
  mayo: 4,
  jun: 5,
  junio: 5,
  june: 5,
  jul: 6,
  julio: 6,
  july: 6,
  ago: 7,
  aug: 7,
  agosto: 7,
  august: 7,
  sep: 8,
  sept: 8,
  septiembre: 8,
  september: 8,
  oct: 9,
  octubre: 9,
  october: 9,
  nov: 10,
  noviembre: 10,
  november: 10,
  dic: 11,
  dec: 11,
  diciembre: 11,
  december: 11,
};

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function parseHevyDate(dateStr: string): number {
  if (!dateStr || !dateStr.trim()) return Date.now();
  const cleaned = dateStr.trim();

  // Try standard ISO or parseable format first
  const parsedTimestamp = Date.parse(cleaned);
  if (!Number.isNaN(parsedTimestamp)) {
    return parsedTimestamp;
  }

  // Format: "12 ene 2024, 18:30" or "12 Jan 2024, 18:30"
  const matchLocale = cleaned.toLowerCase().match(/(\d+)\s+([a-záéíóú]+)\s+(\d+),\s+(\d+):(\d+)/);
  if (matchLocale) {
    const [, day, monthStr, year, hour, minute] = matchLocale;
    const month = MONTH_MAP[monthStr.toLowerCase()] ?? 0;
    return new Date(
      parseInt(year, 10),
      month,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
    ).getTime();
  }

  // Format: "YYYY-MM-DD HH:mm:ss"
  const matchIso = cleaned.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (matchIso) {
    const [, year, month, day, hour, minute] = matchIso;
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
    ).getTime();
  }

  return Date.now();
}

export function parseSetType(type: string): SetType {
  const norm = type ? type.trim().toLowerCase() : '';
  switch (norm) {
    case 'warmup':
      return 'warmup';
    case 'drop':
    case 'dropset':
      return 'drop';
    case 'failure':
      return 'failure';
    case 'normal':
    default:
      return 'normal';
  }
}

export function inferExerciseMetadata(title: string): {
  muscle: Exercise['muscle'];
  equipment: Exercise['equipment'];
} {
  const normalizedTitle = title.trim().toLowerCase();

  // Equipment heuristics
  let equipment: Exercise['equipment'] = 'peso corporal';
  if (
    normalizedTitle.includes('barbell') ||
    normalizedTitle.includes('barra') ||
    normalizedTitle.includes('press banca')
  ) {
    equipment = 'barra';
  } else if (
    normalizedTitle.includes('dumbbell') ||
    normalizedTitle.includes('mancuerna') ||
    normalizedTitle.includes('mancuernas')
  ) {
    equipment = 'mancuernas';
  } else if (
    normalizedTitle.includes('machine') ||
    normalizedTitle.includes('maquina') ||
    normalizedTitle.includes('máquina') ||
    normalizedTitle.includes('smith') ||
    normalizedTitle.includes('multipower') ||
    normalizedTitle.includes('hack')
  ) {
    equipment = 'maquina';
  } else if (
    normalizedTitle.includes('cable') ||
    normalizedTitle.includes('polea') ||
    normalizedTitle.includes('cruce')
  ) {
    equipment = 'polea';
  }

  // Muscle heuristics
  let muscle: Exercise['muscle'] = 'pecho';
  if (
    normalizedTitle.includes('squat') ||
    normalizedTitle.includes('sentadilla') ||
    normalizedTitle.includes('prensa') ||
    normalizedTitle.includes('cuadriceps') ||
    normalizedTitle.includes('leg extension')
  ) {
    muscle = 'cuadriceps';
  } else if (
    normalizedTitle.includes('curl') &&
    !normalizedTitle.includes('leg') &&
    !normalizedTitle.includes('femoral')
  ) {
    muscle = 'biceps';
  } else if (
    normalizedTitle.includes('tricep') ||
    normalizedTitle.includes('tríceps') ||
    normalizedTitle.includes('press frances') ||
    normalizedTitle.includes('fondos')
  ) {
    muscle = 'triceps';
  } else if (
    normalizedTitle.includes('row') ||
    normalizedTitle.includes('remo') ||
    normalizedTitle.includes('pulldown') ||
    normalizedTitle.includes('jalon') ||
    normalizedTitle.includes('jalón') ||
    normalizedTitle.includes('dominadas') ||
    normalizedTitle.includes('pull-up') ||
    normalizedTitle.includes('pull up')
  ) {
    muscle = 'dorsales';
  } else if (
    normalizedTitle.includes('shoulder') ||
    normalizedTitle.includes('hombro') ||
    normalizedTitle.includes('overhead press') ||
    normalizedTitle.includes('press militar') ||
    normalizedTitle.includes('lateral raise') ||
    normalizedTitle.includes('elevaciones laterales')
  ) {
    muscle = 'hombros';
  } else if (
    normalizedTitle.includes('deadlift') ||
    normalizedTitle.includes('peso muerto') ||
    normalizedTitle.includes('hip thrust') ||
    normalizedTitle.includes('glute')
  ) {
    muscle = 'gluteos';
  } else if (
    normalizedTitle.includes('hamstring') ||
    normalizedTitle.includes('femoral') ||
    normalizedTitle.includes('leg curl')
  ) {
    muscle = 'femorales';
  } else if (
    normalizedTitle.includes('crunch') ||
    normalizedTitle.includes('abs') ||
    normalizedTitle.includes('abdomen') ||
    normalizedTitle.includes('plank')
  ) {
    muscle = 'abdominales';
  } else if (
    normalizedTitle.includes('running') ||
    normalizedTitle.includes('carrera') ||
    normalizedTitle.includes('treadmill') ||
    normalizedTitle.includes('cinta') ||
    normalizedTitle.includes('cycling') ||
    normalizedTitle.includes('bici') ||
    normalizedTitle.includes('cardio')
  ) {
    muscle = 'cardio';
  }

  return { muscle, equipment };
}

export interface ParsedHevyImport {
  workouts: CompletedWorkout[];
  newCustomExercises: Exercise[];
  totalSets: number;
  firstDate: number | null;
  lastDate: number | null;
}

export function roundToTwoDecimals(val: string): string {
  if (!val || !val.trim()) return '';
  const num = parseFloat(val.replace(',', '.'));
  if (Number.isNaN(num) || !Number.isFinite(num)) return '';
  return (Math.round(num * 100) / 100).toString();
}

export function parseHevyCsv(
  csvContent: string,
  catalog: Exercise[] = EXERCISE_CATALOG,
  currentCustomExercises: Exercise[] = [],
): ParsedHevyImport {
  const rows = parseCsvRows(csvContent);
  if (rows.length < 2) {
    throw new Error('El archivo CSV está vacío o no contiene filas de datos.');
  }

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const colIndex = {
    title: header.indexOf('title'),
    startTime: header.indexOf('start_time'),
    endTime: header.indexOf('end_time'),
    description: header.indexOf('description'),
    exerciseTitle: header.indexOf('exercise_title'),
    supersetId: header.indexOf('superset_id'),
    exerciseNotes: header.indexOf('exercise_notes'),
    setType: header.indexOf('set_type'),
    weightKg: header.indexOf('weight_kg'),
    reps: header.indexOf('reps'),
    distanceKm: header.indexOf('distance_km'),
    durationSeconds: header.indexOf('duration_seconds'),
    rpe: header.indexOf('rpe'),
  };

  if (colIndex.exerciseTitle === -1 || colIndex.startTime === -1) {
    throw new Error(
      'Formato CSV de Hevy no reconocido. Faltan las columnas start_time o exercise_title.',
    );
  }

  const workoutsMap = new Map<string, CompletedWorkout>();
  const newCustomExercises: Exercise[] = [];
  const exerciseIdByName = new Map<string, string>();

  // Helper to find or assign an exercise ID
  const getExerciseId = (rawTitle: string): string => {
    const title = rawTitle.trim();
    const normalized = title.toLowerCase();

    if (exerciseIdByName.has(normalized)) {
      return exerciseIdByName.get(normalized)!;
    }

    // 1. Search in native catalog
    const catalogMatch = catalog.find((e) => e.name.toLowerCase() === normalized);
    if (catalogMatch) {
      exerciseIdByName.set(normalized, catalogMatch.id);
      return catalogMatch.id;
    }

    // 2. Search in current custom exercises
    const customMatch = currentCustomExercises.find((e) => e.name.toLowerCase() === normalized);
    if (customMatch) {
      exerciseIdByName.set(normalized, customMatch.id);
      return customMatch.id;
    }

    // 3. Search in newly created custom exercises
    const newlyCreated = newCustomExercises.find((e) => e.name.toLowerCase() === normalized);
    if (newlyCreated) {
      exerciseIdByName.set(normalized, newlyCreated.id);
      return newlyCreated.id;
    }

    // 4. Create new custom exercise
    const { muscle, equipment } = inferExerciseMetadata(title);
    const newEx: Exercise = {
      id: uid(),
      name: title,
      muscle,
      equipment,
      custom: true,
    };
    newCustomExercises.push(newEx);
    exerciseIdByName.set(normalized, newEx.id);
    return newEx.id;
  };

  let totalSets = 0;
  let firstDate: number | null = null;
  let lastDate: number | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const getVal = (idx: number) => (idx !== -1 && row[idx] ? row[idx] : '');

    const title = getVal(colIndex.title) || 'Entrenamiento importado';
    const startTimeRaw = getVal(colIndex.startTime);
    const endTimeRaw = getVal(colIndex.endTime);
    const description = getVal(colIndex.description);
    const exerciseTitle = getVal(colIndex.exerciseTitle);
    const supersetId = getVal(colIndex.supersetId);
    const exerciseNotes = getVal(colIndex.exerciseNotes);
    const setTypeRaw = getVal(colIndex.setType);
    const weightKg = getVal(colIndex.weightKg);
    const reps = getVal(colIndex.reps);
    const distanceKm = getVal(colIndex.distanceKm);
    const durationSeconds = getVal(colIndex.durationSeconds);
    const rpe = getVal(colIndex.rpe);

    if (!exerciseTitle && !startTimeRaw) continue;

    const startedAt = parseHevyDate(startTimeRaw);
    const finishedAt = endTimeRaw ? parseHevyDate(endTimeRaw) : startedAt + 3600000;

    if (firstDate === null || startedAt < firstDate) firstDate = startedAt;
    if (lastDate === null || startedAt > lastDate) lastDate = startedAt;

    const workoutKey = `${title}_${startTimeRaw}`;
    let workout = workoutsMap.get(workoutKey);

    if (!workout) {
      workout = {
        id: uid(),
        name: title.substring(0, 100),
        startedAt,
        finishedAt,
        notes: description.substring(0, 500),
        exercises: [],
      };
      workoutsMap.set(workoutKey, workout);
    }

    const exerciseId = getExerciseId(exerciseTitle || 'Ejercicio importado');

    let currentExerciseBlock: WorkoutExercise | null =
      workout.exercises.length > 0 ? workout.exercises[workout.exercises.length - 1] : null;

    if (!currentExerciseBlock || currentExerciseBlock.exerciseId !== exerciseId) {
      currentExerciseBlock = {
        id: uid(),
        exerciseId,
        notes: exerciseNotes.substring(0, 500),
        supersetId: supersetId ? `superset_${supersetId}` : undefined,
        sets: [],
      };
      workout.exercises.push(currentExerciseBlock);
    }

    const newSet: WorkoutSet = {
      id: uid(),
      type: parseSetType(setTypeRaw),
      weight: roundToTwoDecimals(weightKg).substring(0, 20),
      reps: reps.replace(/[^\d]/g, '').substring(0, 20),
      distance: roundToTwoDecimals(distanceKm).substring(0, 20),
      duration: durationSeconds ? `${durationSeconds.substring(0, 10)}s` : '',
      rpe: rpe.substring(0, 20),
      completed: true,
    };

    currentExerciseBlock.sets.push(newSet);
    totalSets++;
  }

  const workouts = Array.from(workoutsMap.values());
  return {
    workouts,
    newCustomExercises,
    totalSets,
    firstDate,
    lastDate,
  };
}
