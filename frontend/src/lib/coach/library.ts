import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type { ProgramSummary } from './coachPrograms';
export interface LibraryItem {
  type: 'PROGRAM' | 'EXERCISE';
  id: string;
  favorite: boolean;
  category: 'PROGRAM' | 'WEEK' | 'SESSION' | 'BLOCK' | 'EXERCISE';
  tags: string[];
  minutes: number | null;
  equipment: string;
  lastUsed: string | null;
  used?: boolean;
}
export const CATEGORIES = {
  PROGRAM: 'Programa',
  WEEK: 'Semana',
  SESSION: 'Sesión',
  BLOCK: 'Bloque',
  EXERCISE: 'Ejercicio',
};
export const defaultItem = (type: LibraryItem['type'], id: string): LibraryItem => ({
  type,
  id,
  favorite: false,
  category: type,
  tags: [],
  minutes: null,
  equipment: '',
  lastUsed: null,
});
export const programCategory = (p: ProgramSummary) =>
  p.weeks === 1 ? (p.dayCount === 1 ? 'SESSION' : 'WEEK') : 'PROGRAM';
const key = ['coach', 'library-items'];
export const useLibraryItems = () =>
  useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<LibraryItem[]>('/coach/library-items')).data,
  });
export function useSaveLibraryItem() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (item: LibraryItem) =>
      (await api.put<LibraryItem[]>('/coach/library-items', item)).data,
    onSuccess: (items) => cache.setQueryData(key, items),
  });
}
