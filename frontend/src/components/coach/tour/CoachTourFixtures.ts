import type { CoachClient } from '../../../lib/coach/api';
import type { Program } from '../../../lib/coach/coachPrograms';
import type { Checkin } from '../../../lib/coach/checkins';
import type { ProfessionalSettings } from '../../../lib/coach/professionalSettings';
import { shiftWeek, weekDate } from '../../../lib/coach/weeks';

export const tourWeek = weekDate();
export const tourNextWeek = shiftWeek(tourWeek, 1);
export const tourClients: CoachClient[] = [
  {
    linkId: 'tour-lucia',
    client: { name: 'Lucía Vega', email: 'lucia@example.test', picture: null },
    since: shiftWeek(tourWeek, -3),
    permissions: {
      training: true,
      editTraining: true,
      nutrition: true,
      editNutrition: true,
      body: true,
    },
    setup: {
      services: { training: true, nutrition: true, progress: true },
      goal: 'Preparar powerlifting',
      experience: 'Intermedia',
      trainingDays: 3,
      equipment: 'Gimnasio completo',
      reviewed: true,
    },
  },
  {
    linkId: 'tour-mateo',
    client: { name: 'Mateo Gil', email: 'mateo@example.test', picture: null },
    since: shiftWeek(tourWeek, -2),
    permissions: {
      training: true,
      editTraining: true,
      nutrition: false,
      editNutrition: false,
      body: true,
    },
    setup: {
      services: { training: true, nutrition: false, progress: true },
      goal: 'Fuerza general',
      experience: 'Principiante',
      trainingDays: 2,
      equipment: 'Mancuernas',
      reviewed: true,
    },
  },
];
export const tourProgram: Program = {
  id: 'tour-program',
  name: 'Fuerza · semana base',
  weeks: 1,
  status: 'READY',
  notes: 'Prioriza técnica y registra el esfuerzo de cada serie.',
  days: [
    {
      week: 1,
      dayIndex: 1,
      name: 'Sentadilla y accesorios',
      notes: 'Calentamiento progresivo.',
      exercises: [
        {
          exerciseId: 'base-cuadriceps-sentadilla-barra',
          exerciseName: 'Sentadilla',
          sets: 3,
          repsMin: 5,
          repsMax: 5,
          targetRpe: 8,
          targetRir: null,
          restSeconds: 180,
          loadHint: null,
          supersetGroup: null,
          notes: 'Mantén el rango de movimiento.',
          prescription: { load: { mode: 'KG', amount: 80, unit: 'TOTAL' } },
        },
      ],
    },
  ],
};
export const tourCheckin: Checkin = {
  id: 'tour-checkin',
  linkId: 'tour-lucia',
  weekStart: tourWeek,
  weightAvg: 63.4,
  energy: 2,
  sleep: 3,
  trainingAdherence: 4,
  dietAdherence: 4,
  answers: [
    {
      question: '¿Qué te ha costado más?',
      answer: 'La última serie de sentadilla. He dormido menos estos días.',
    },
  ],
  notes: 'He completado las sesiones, pero me noto más cansada.',
  coachReply: null,
  repliedAt: null,
  createdAt: `${tourWeek}T18:00:00Z`,
  updatedAt: `${tourWeek}T18:00:00Z`,
  updates: [],
  submissionStatus: 'FINAL',
};
export const tourSettings: ProfessionalSettings = {
  displayName: 'Laura Díaz · Entrenadora',
  presentation: 'Entrenamiento de fuerza adaptado a cada persona.',
  showAccountPhoto: false,
  services: { training: true, nutrition: false, progress: true },
  prefill: true,
  review: { day: 7, time: '18:00', timeZone: 'Europe/Madrid', paused: false },
  version: 1,
};
export const tourAssignment = {
  id: 'tour-assignment',
  programId: tourProgram.id,
  sourceProgramId: tourProgram.id,
  programName: tourProgram.name,
  weeks: 1,
  startDate: tourWeek,
  status: 'ACTIVE',
  createdAt: `${tourWeek}T10:00:00Z`,
  endedAt: null,
};
export const tourStatuses = tourClients.map((client, index) => ({
  linkId: client.linkId,
  level: 'AMBER',
  lastActivity: tourWeek,
  pendingReplies: index === 0 ? 1 : 0,
  weightChange: null,
  signals: [{ reason: 'NO_FUTURE_PROGRAM', level: 'AMBER', value: 0 }],
}));
