import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { publishProblems, type Program } from './coachPrograms';
import { weekVolume } from './weekBoard';
import { INTENTS, weekDate, type SavedWeek } from './weeks';

export interface BlockDefinition {
  name: string;
  startWeek: string;
  weeks: number;
}
export interface Block {
  /** The athlete's named block, when the coach has defined one. */
  block: BlockDefinition | null;
  weeks: SavedWeek[];
}

export const BLOCK_LENGTHS = [4, 6, 8, 12];
export const BLOCK_NAME_MAX = 80;

const path = (id: string) => `/coach/clients/${encodeURIComponent(id)}/block`;
const scope = (id: string) => ['coach', 'clients', id];

export const useCoachBlock = (id: string, from: string, weeks: number) =>
  useQuery({
    queryKey: [...scope(id), 'block', from, weeks],
    queryFn: async () => (await api.get<Block>(path(id), { params: { from, weeks } })).data,
    placeholderData: (previous) => previous,
    // The editor saves these same weeks through its own queries: never trust what was cached.
    refetchOnMount: 'always',
  });

/** Every change here touches weeks the editor also shows, so the athlete's planning is refetched whole. */
function useBlockMutation<T>(id: string, run: (value: T) => Promise<unknown>) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: () => cache.invalidateQueries({ queryKey: scope(id) }),
  });
}

export const useSaveBlock = (id: string) =>
  useBlockMutation(id, (block: BlockDefinition) => api.put(path(id), block));
export const useDeleteBlock = (id: string) =>
  useBlockMutation<void>(id, () => api.delete(path(id)));
export const usePublishBlock = (id: string) =>
  useBlockMutation(id, (weeks: SavedWeek[]) =>
    api.post(`${path(id)}/publish`, {
      weeks: weeks.map((week) => ({ week: week.weekStart, expectedVersion: week.version })),
    }),
  );
export const useRepeatWeek = (id: string) =>
  useBlockMutation(id, (request: { source: string; targets: string[] }) =>
    api.post(`${path(id)}/repeat`, request),
  );
export const useSetWeekIntent = (id: string) =>
  useBlockMutation(id, ({ week, intent }: { week: SavedWeek; intent: keyof typeof INTENTS }) =>
    api.put(`/coach/clients/${encodeURIComponent(id)}/weeks/${week.weekStart}`, {
      content: { ...week.content, intent },
      expectedVersion: week.version,
    }),
  );

export type WeekState = 'past' | 'empty' | 'draft' | 'incomplete' | 'published' | 'changed';
export const WEEK_STATE: Record<WeekState, string> = {
  past: 'Pasada',
  empty: 'Sin preparar',
  draft: 'Borrador',
  incomplete: 'Incompleta',
  published: 'Publicada',
  changed: 'Cambios sin publicar',
};

export function weekState(week: SavedWeek, today = weekDate()): WeekState {
  const published = week.publishedVersion != null;
  if (published && week.publishedVersion === week.version) return 'published';
  if (week.weekStart < today) return 'past';
  if (!week.content.program.days.length) return 'empty';
  if (publishProblems(week.content.program).length) return 'incomplete';
  return published ? 'changed' : 'draft';
}

/** Weeks that can reach the athlete right now. */
export const publishable = (weeks: SavedWeek[]) =>
  weeks.filter((week) => ['draft', 'changed'].includes(weekState(week)) && week.version > 0);

/** The weeks with sessions as one library program, a week of the program per week of the block. */
export function blockProgram(name: string, weeks: SavedWeek[]): Program {
  const planned = weeks.map((week) => week.content.program.days.length > 0);
  const kept = weeks.slice(planned.indexOf(true), planned.lastIndexOf(true) + 1);
  const days = kept.flatMap((week, index) =>
    structuredClone(week.content.program.days).map((day) => ({ ...day, week: index + 1 })),
  );
  const program: Program = { id: null, name, notes: null, weeks: kept.length, days };
  return { ...program, status: publishProblems(program).length ? 'DRAFT' : 'READY' };
}

/** Work sets per muscle group in each week, for reading how the load moves along the block. */
export function blockLoad(weeks: SavedWeek[], muscleOf: Parameters<typeof weekVolume>[2]) {
  const volumes = weeks.map((week) => weekVolume(week.content.program, null, muscleOf));
  const totals = new Map<string, { label: string; total: number }>();
  for (const volume of volumes)
    for (const group of volume.groups)
      totals.set(group.id, {
        label: group.label,
        total: (totals.get(group.id)?.total ?? 0) + group.sets,
      });
  const groups = [...totals.entries()]
    .sort(([, a], [, b]) => b.total - a.total || a.label.localeCompare(b.label, 'es'))
    .map(([id, { label }]) => ({
      id,
      label,
      sets: volumes.map((volume) => volume.groups.find((group) => group.id === id)?.sets ?? 0),
    }));
  return {
    groups,
    max: Math.max(1, ...groups.flatMap((group) => group.sets)),
    weeks: volumes.map(({ sets, tonnage }) => ({ sets, tonnage })),
  };
}
