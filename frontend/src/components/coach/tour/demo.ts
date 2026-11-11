import type { ProgramExercise } from '../../../lib/coach/coachPrograms';
import type { CoachTourStepId } from './steps';

export interface CoachDemo {
  copied: boolean;
  load: string;
  reps: string;
  rpe: string;
  sessionAdded: boolean;
  comment: string;
  privateNote: string;
  reply: string;
  question: string;
  published: boolean;
  feedback: string;
}

export const initialDemo: CoachDemo = {
  copied: false,
  load: '80',
  reps: '5',
  rpe: '8',
  sessionAdded: false,
  comment: '',
  privateNote: '',
  reply: '',
  question: '¿Cómo te has encontrado esta semana?',
  published: false,
  feedback: '',
};

export function demonstrate(state: CoachDemo, step: CoachTourStepId): CoachDemo {
  switch (step) {
    case 'overview':
      return {
        ...state,
        feedback:
          'Revisiones: Lucía tiene un check-in pendiente y Mateo necesita plan para la próxima semana.',
      };
    case 'invite':
      return {
        ...state,
        feedback:
          'Invitación de ejemplo preparada para Mateo Gil · fuerza general · 3 días. No se ha creado ningún enlace real.',
      };
    case 'client':
      return {
        ...state,
        feedback: 'Ficha de Lucía Vega abierta: powerlifting · 3 días · seguimiento semanal.',
      };
    case 'checkin':
      return {
        ...state,
        reply:
          state.reply ||
          'Gracias, Lucía. Revisaré la carga de esta semana teniendo en cuenta el cansancio.',
        feedback: 'Respuesta guardada en la demo.',
      };
    case 'history':
      return {
        ...state,
        feedback:
          'Sesión revisada: el esfuerzo de la última serie superó el RPE pautado. Comprueba el resto de sesiones antes de ajustar.',
      };
    case 'copy':
      return {
        ...state,
        copied: true,
        published: false,
        feedback:
          'Semana copiada: lunes, miércoles y viernes. El borrador está listo para adaptar.',
      };
    case 'edit':
      return {
        ...state,
        copied: true,
        load: '75',
        reps: '5',
        rpe: '7',
        published: false,
        feedback:
          'Ejemplo aplicado: sentadilla a 75 kg, 5 repeticiones y RPE 7. No es una recomendación de carga individual.',
      };
    case 'library':
      return {
        ...state,
        sessionAdded: true,
        published: false,
        feedback: 'Sesión «Torso · 45 minutos» añadida al miércoles del borrador de ejemplo.',
      };
    case 'notes':
      return {
        ...state,
        comment:
          state.comment || 'Semana de descarga. Prioriza la técnica y registra cómo te encuentras.',
        privateNote:
          state.privateNote || 'Revisar recuperación y feedback antes del siguiente bloque.',
        published: false,
        feedback:
          'Comentario y nota privada preparados. Solo el comentario se muestra en la vista del alumno.',
      };
    case 'publish':
      return {
        ...state,
        published: true,
        feedback: 'Semana publicada solo en la demo. Debajo puedes ver el resultado como Lucía.',
      };
    case 'powerlifting':
      return {
        ...state,
        feedback:
          'Referencias de ejemplo: sentadilla 110 kg, banca 65 kg y peso muerto 140 kg. En cada alumno se registran sus propias referencias.',
      };
    case 'nutrition':
      return {
        ...state,
        feedback:
          'Pauta de ejemplo abierta: comidas habituales y alternativas. La ficha real respeta los servicios y permisos del alumno.',
      };
    case 'settings':
      return {
        ...state,
        question: '¿Qué sesión te ha costado más y por qué?',
        feedback:
          'Pregunta de ejemplo actualizada. En Ajustes puedes personalizar tu plantilla de check-in.',
      };
    default:
      return state;
  }
}

export function demoPrescription(state: CoachDemo): ProgramExercise {
  return {
    exerciseId: 'demo-squat',
    exerciseName: 'Sentadilla',
    sets: 3,
    repsMin: Number(state.reps) || null,
    repsMax: Number(state.reps) || null,
    targetRpe: Number(state.rpe) || null,
    targetRir: null,
    restSeconds: 180,
    loadHint: `${state.load || '0'} kg`,
    supersetGroup: null,
    notes: null,
  };
}
