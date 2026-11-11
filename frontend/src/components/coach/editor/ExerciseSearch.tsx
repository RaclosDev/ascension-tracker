import { useMemo, useState } from 'react';
import { Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useExerciseCatalog } from '@/lib/workout/catalog-query';
import { BASE_EXERCISES } from '@/lib/workout/exercises';
import { useCustomExercises } from '@/lib/workout/api';
import { normalizeString } from '@/lib/workout/format';
import type { Exercise } from '@/lib/workout/types';
import { defaultItem, useLibraryItems, useSaveLibraryItem } from '@/lib/coach/library';
import { apiErrorMessage } from '@/lib/coach/api';
import { inputClass, inputStyle } from './fields';

export function ExerciseSearch({ onPick }: { onPick: (exercise: Exercise) => void }) {
  const { data: catalog = [] } = useExerciseCatalog();
  const { data: custom = [] } = useCustomExercises();
  const items = useLibraryItems();
  const mark = useSaveLibraryItem();
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState('');
  const [favorites, setFavorites] = useState(false);
  const all = useMemo(() => {
    const seen = new Set<string>();
    return [...custom, ...BASE_EXERCISES, ...catalog].filter((ex) => {
      if (seen.has(ex.id)) return false;
      seen.add(ex.id);
      return true;
    });
  }, [custom, catalog]);
  const itemFor = (id: string) =>
    items.data?.find((item) => item.type === 'EXERCISE' && item.id === id);
  const results = all
    .filter(
      (ex) =>
        (!equipment || ex.equipment === equipment) &&
        (!favorites || itemFor(ex.id)?.favorite) &&
        normalizeString([ex.name, ...(ex.tags ?? [])].join(' ')).includes(
          normalizeString(query.trim()),
        ),
    )
    .sort(
      (a, b) =>
        Number(!!itemFor(b.id)?.favorite) - Number(!!itemFor(a.id)?.favorite) ||
        (itemFor(b.id)?.lastUsed ?? '').localeCompare(itemFor(a.id)?.lastUsed ?? ''),
    )
    .slice(0, 8);
  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        aria-label="Buscar ejercicio para añadir"
        placeholder="Añadir ejercicio: nombre o etiqueta"
        className={inputClass}
        style={inputStyle}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <label>
          Material
          <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            <option value="">Todos</option>
            {[...new Set(all.map((ex) => ex.equipment))].sort().map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={favorites}
            onChange={(e) => setFavorites(e.target.checked)}
          />
          Solo favoritos
        </label>
        {!query && <p>Favoritos y recientes primero</p>}
      </div>
      <ul className="flex flex-col gap-1" aria-label="Resultados">
        {!results.length && <li>Nada coincide con esos filtros.</li>}
        {results.map((ex) => (
          <li key={ex.id} className="flex gap-1">
            <button
              type="button"
              className="btn btn-secondary flex-1 justify-start"
              onClick={() => {
                onPick(ex);
                setQuery('');
                if (items.isSuccess)
                  mark.mutate({ ...defaultItem('EXERCISE', ex.id), ...itemFor(ex.id), used: true });
              }}
            >
              <Plus size={14} aria-hidden />
              {ex.name}
              {ex.custom && <span className="text-xs ml-auto">propio</span>}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              aria-label={`Favorito: ${ex.name}`}
              aria-pressed={itemFor(ex.id)?.favorite ?? false}
              disabled={!items.isSuccess || mark.isPending}
              onClick={() =>
                mark.mutate(
                  {
                    ...defaultItem('EXERCISE', ex.id),
                    ...itemFor(ex.id),
                    favorite: !itemFor(ex.id)?.favorite,
                  },
                  {
                    onError: (error) =>
                      toast.error(apiErrorMessage(error, 'No se pudo guardar el favorito')),
                  },
                )
              }
            >
              <Star
                size={15}
                fill={itemFor(ex.id)?.favorite ? 'currentColor' : 'none'}
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
