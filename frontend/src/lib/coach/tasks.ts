import type { CoachRow } from './workspace';
import { signalText, type StatusSignal } from './clientStatus';

export interface CoachTask {
  id: string;
  title: string;
  detail: string;
  section: string;
  owner: 'coach' | 'client';
}

export function signalSection(signal: StatusSignal): string {
  switch (signal.reason) {
    case 'NO_PROGRAM':
      return 'entrenamiento';
    case 'NO_NUTRITION_PLAN':
    case 'FEW_FOOD_LOGS':
      return 'nutricion';
    case 'WEIGHT_STALLED':
      return 'progreso';
    case 'CHECKIN_MISSING':
      return 'revisiones';
    default:
      return 'resumen';
  }
}

export function clientTasks({ link, status }: CoachRow): CoachTask[] {
  const tasks: CoachTask[] = [];
  if ((status?.pendingReplies ?? 0) > 0)
    tasks.push({
      id: 'reply',
      title: 'Responder revisiones',
      detail: `${status?.pendingReplies} por responder`,
      section: 'revisiones',
      owner: 'coach',
    });
  if (link.followup?.schedule.paused) return tasks;
  if (!link.setup)
    return [
      ...tasks,
      {
        id: 'setup',
        title: 'Configurar servicio',
        detail: 'Falta concretar el trabajo acordado.',
        section: 'gestion',
        owner: 'coach',
      },
    ];
  if (!link.setup.reviewed)
    tasks.push({
      id: 'onboarding',
      title: 'Revisar incorporación',
      detail: 'Confirma el objetivo y los datos iniciales.',
      section: 'gestion',
      owner: 'coach',
    });
  const services = link.setup.services;
  const missing = [
    services.training && !link.permissions.training && 'entrenamiento',
    services.nutrition && !link.permissions.nutrition && 'nutrición',
    services.progress && !link.permissions.body && 'seguimiento corporal',
  ].filter(Boolean);
  if (missing.length)
    tasks.push({
      id: 'consent',
      title: 'Confirmar permisos con el alumno',
      detail: `Falta acceso a ${missing.join(' y ')}. Solo el alumno puede autorizarlo.`,
      section: 'gestion',
      owner: 'client',
    });
  for (const signal of status?.signals ?? []) {
    if (signal.reason === 'NO_PROGRAM' && (!services.training || !link.permissions.editTraining))
      continue;
    if (['NO_NUTRITION_PLAN', 'FEW_FOOD_LOGS'].includes(signal.reason) && !services.nutrition)
      continue;
    if (signal.reason === 'WEIGHT_STALLED' && !services.progress) continue;
    tasks.push({
      id: signal.reason,
      title:
        signal.reason === 'NO_PROGRAM'
          ? 'Preparar entrenamiento'
          : signal.reason === 'NO_NUTRITION_PLAN'
            ? 'Preparar pauta nutricional'
            : signal.reason === 'CHECKIN_MISSING'
              ? 'Consultar revisión pendiente'
              : 'Revisar seguimiento',
      detail: signalText(signal),
      section: signalSection(signal),
      owner: signal.reason === 'CHECKIN_MISSING' ? 'client' : 'coach',
    });
  }
  return tasks;
}
