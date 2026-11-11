import { differenceInCalendarDays, parseISO } from 'date-fns';
import { personName, useCoachClients, type CoachClient } from './api';
import { LEVEL_ORDER, useClientStatus, type ClientStatus } from './clientStatus';

export interface CoachRow {
  link: CoachClient;
  status: ClientStatus | undefined;
}

export const followupSignals = (status: ClientStatus | undefined) => status?.signals ?? [];

export const followupLevel = (status: ClientStatus | undefined) =>
  followupSignals(status).reduce<'GREEN' | 'AMBER' | 'RED'>(
    (level, signal) => (LEVEL_ORDER[signal.level] < LEVEL_ORDER[level] ? signal.level : level),
    'GREEN',
  );

export function useCoachRoster() {
  const clients = useCoachClients(true);
  const status = useClientStatus(true);
  const byId = new Map(status.isError ? [] : status.data?.map((s) => [s.linkId, s]));
  const rows: CoachRow[] = (clients.data ?? [])
    .map((link) => ({ link, status: byId.get(link.linkId) }))
    .sort(
      (a, b) =>
        (b.status?.pendingReplies ?? 0) - (a.status?.pendingReplies ?? 0) ||
        LEVEL_ORDER[followupLevel(a.status)] - LEVEL_ORDER[followupLevel(b.status)] ||
        personName(a.link.client).localeCompare(personName(b.link.client), 'es'),
    );
  const ready =
    clients.isSuccess &&
    status.isSuccess &&
    !status.isError &&
    rows.every((row) => row.status !== undefined);
  return { clients, status, rows, ready };
}

export function activityText(iso: string | null | undefined) {
  if (iso === undefined) return 'Actividad no disponible';
  if (iso === null) return 'Sin registros';
  const days = differenceInCalendarDays(new Date(), parseISO(iso));
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

export const clientHref = (linkId: string, section = 'resumen') =>
  `/entrenador/alumnos/${encodeURIComponent(linkId)}?seccion=${section}`;

export const searchName = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es');
