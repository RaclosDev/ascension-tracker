import { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';
import api from '../../../api/client';
import { isCoachTourFrame } from './frame';
import {
  tourAssignment,
  tourCheckin,
  tourClients,
  tourNextWeek,
  tourProgram,
  tourSettings,
  tourStatuses,
  tourWeek,
} from './CoachTourFixtures';

export function tourResponse(path: string): unknown {
  if (path === '/coach/profile') return { coach: true };
  if (path === '/coach/settings') return tourSettings;
  if (path === '/coach/clients') return tourClients;
  if (path === '/coach/clients/status') return tourStatuses;
  if (path.endsWith('/checkin-template'))
    return { questions: ['¿Qué ha ido bien?', '¿Qué sesión te ha costado más?'], custom: true };
  const client = tourClients.find((item) => path === `/coach/clients/${item.linkId}`);
  if (client) return client;
  if (/\/clients\/tour-[^/]+\/status$/.test(path))
    return tourStatuses.find((item) => path.includes(item.linkId));
  if (path.endsWith('/checkins')) return [tourCheckin];
  if (path.endsWith('/powerlifting'))
    return {
      linkId: 'tour-lucia',
      version: 1,
      updatedAt: null,
      profile: {
        enabled: path.includes('tour-lucia'),
        equipment: 'CLASSIC',
        federation: 'Ejemplo',
        trainingMax: { squat: 110, bench: 65, deadlift: 140 },
        marks: [],
        exerciseMappings: [],
        notes: 'Preparación de fuerza.',
      },
    };
  if (/\/weeks\/\d{4}-\d{2}-\d{2}$/.test(path))
    return {
      linkId: 'tour-lucia',
      weekStart: path.split('/').at(-1) ?? tourNextWeek,
      version: 0,
      assignmentId: null,
      publishedVersion: null,
      updatedAt: null,
      content: {
        program: { ...tourProgram, id: null, days: [], status: 'DRAFT', name: 'Próxima semana' },
        privateNotes: '',
        intent: 'DELOAD',
        decision: '',
      },
    };
  if (/\/clients\/[^/]+\/programs$/.test(path)) return [tourAssignment];
  if (path.endsWith('/plan') && path.includes('/programs/')) return tourProgram;
  if (path.endsWith('/sessions'))
    return [
      {
        dayId: 'tour-day',
        week: 1,
        dayIndex: 1,
        date: tourWeek,
        name: 'Sentadilla y accesorios',
        notes: null,
        exercises: tourProgram.days[0].exercises,
        workoutId: null,
        workoutName: null,
        finishedAt: null,
        origin: null,
        comment: null,
      },
    ];
  if (path === '/coach/programs')
    return [{ ...tourProgram, dayCount: 1, updatedAt: `${tourWeek}T10:00:00Z` }];
  if (path === '/coach/programs/tour-program') return tourProgram;
  if (path === '/coach/library-items')
    return [
      {
        id: 'tour-program',
        type: 'PROGRAM',
        category: 'SESSION',
        favorite: true,
        tags: ['Fuerza'],
        equipment: 'Barra',
        minutes: 45,
        lastUsed: null,
      },
    ];
  if (path.endsWith('/nutrition-plan')) return null;
  if (path.endsWith('/workouts')) return { content: [], totalPages: 0, totalElements: 0 };
  if (path.endsWith('/workouts/stats'))
    return { totalWorkouts: 6, totalDurationSeconds: 16200, totalVolume: 12480, totalSets: 54 };
  if (path.endsWith('/weights/dashboard'))
    return {
      currentWeight: 63.4,
      currentWeeklyAverage: 63.6,
      totalLost: -0.2,
      avgWeeklyChange: -0.1,
    };
  if (path.endsWith('/progress-photos')) return { photos: [] };
  if (path.endsWith('/targets'))
    return { kcal: 2200, customProteinGrams: 120, customFatGrams: 70, customCarbsGrams: 270 };
  if (/\/(weekly|recent|logs|adherence|history)$/.test(path)) return [];
  if (
    /\/(custom-exercises|workouts|meets|blocks|invitations|recipes|nutrition-templates|access-log|weights|measures|goals|free-workouts)$/.test(
      path,
    )
  )
    return [];
  throw new Error(`Pantalla del tour sin datos: ${path}`);
}

// This adapter is installed only in the tour iframe: the parent app keeps its own API and cache.
export function installCoachTourPreview() {
  if (!isCoachTourFrame()) throw new Error('El tour necesita su pantalla aislada.');
  const adapter: AxiosAdapter = async (config) => {
    if ((config.method ?? 'get').toLowerCase() !== 'get') {
      throw new AxiosError(
        'El tour enseña dónde guardar; sal del recorrido para trabajar con tus alumnos.',
        'ERR_TOUR_READ_ONLY',
        config,
      );
    }
    const path = (config.url ?? '').split('?')[0];
    return {
      data: structuredClone(tourResponse(path)),
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config,
    };
  };
  return api.interceptors.request.use((config) => {
    const path = config.url ?? '';
    const coaching = /^\/(coach|coaching)(\/|$)/.test(path);
    const readOnly = (config.method ?? 'get').toLowerCase() === 'get';
    if (coaching || (!readOnly && !path.startsWith('/auth/'))) config.adapter = adapter;
    return config;
  });
}
