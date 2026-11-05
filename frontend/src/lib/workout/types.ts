export type MuscleGroup =
  | 'pecho'
  | 'espalda_alta'
  | 'dorsales'
  | 'lumbares'
  | 'trapecios'
  | 'cuadriceps'
  | 'femorales'
  | 'gluteos'
  | 'gemelos'
  | 'abductores'
  | 'aductores'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazos'
  | 'abdominales'
  | 'cardio';

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda_alta: 'Espalda alta',
  dorsales: 'Dorsales',
  lumbares: 'Lumbares',
  trapecios: 'Trapecios',
  cuadriceps: 'Cuádriceps',
  femorales: 'Femorales',
  gluteos: 'Glúteos',
  gemelos: 'Gemelos',
  abductores: 'Abductores',
  aductores: 'Aductores',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazos: 'Antebrazos',
  abdominales: 'Abdominales',
  cardio: 'Cardio',
};

export type Equipment =
  | 'barra'
  | 'mancuernas'
  | 'maquina'
  | 'peso corporal'
  | 'polea'
  | 'banda'
  | 'multipower'
  | 'kettlebell';

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export type Tab = 'home' | 'train' | 'templates' | 'history' | 'exercises';

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  custom?: boolean;
  gifUrl?: string;
  synergists?: Partial<Record<MuscleGroup, number>>;
  tags?: string[];
  options?: {
    grips?: string[];
  };
}

export interface WorkoutSet {
  id: string;
  type: SetType;
  weight: string;
  reps: string;
  distance?: string;
  duration?: string;
  rpe?: string;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  variant?: {
    grip?: string;
    machine?: string;
  };
  notes: string;
  supersetId?: string;
  sets: WorkoutSet[];
}

/** How a workout relates to a coach's program: done as written, or changed by the client. */
export type ProgramOrigin = 'PRESCRIBED' | 'PRESCRIBED_MODIFIED';

/** What a prescribed day asked for, to tell on finishing whether the client changed it. */
export interface ProgramPlanItem {
  exerciseId: string;
  sets: number;
}

export interface ActiveWorkout {
  name: string;
  startedAt: number;
  notes?: string;
  exercises: WorkoutExercise[];
  editingId?: string;
  editingFinishedAt?: number;
  programDayId?: string;
  programOrigin?: ProgramOrigin;
  programPlan?: ProgramPlanItem[];
}

export interface CompletedWorkout {
  id: string;
  name: string;
  startedAt: number;
  finishedAt: number;
  notes?: string;
  exercises: WorkoutExercise[];
  programDayId?: string | null;
  programOrigin?: ProgramOrigin | null;
}

export interface Template {
  id: string;
  name: string;
  exercises: { exerciseId: string; variant?: { grip?: string; machine?: string } }[];
}

export const SET_TYPE_CYCLE: SetType[] = ['normal', 'warmup', 'drop', 'failure'];

export const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: '',
  warmup: 'W',
  drop: 'D',
  failure: 'F',
};
