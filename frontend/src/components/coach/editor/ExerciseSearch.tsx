import '../../../styles/exercise-search.css';
import { useContext, useMemo, useRef, useState } from 'react';
import { Dumbbell, Plus, Search, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useExerciseCatalog } from '@/lib/workout/catalog-query';
import { BASE_EXERCISES } from '@/lib/workout/exercises';
import { useCustomExercises } from '@/lib/workout/api';
import { normalizeString } from '@/lib/workout/format';
import type { Exercise } from '@/lib/workout/types';
import { defaultItem, useLibraryItems, useSaveLibraryItem } from '@/lib/coach/library';
import { apiErrorMessage } from '@/lib/coach/api';
import { AthleteAvoided } from './prescribing';
import { Select } from '@/components/ui/select';

const EQUIPMENT_LABEL: Record<string, string> = { maquina: 'máquina' };
const equipmentLabel = (value: string) => {
  const text = EQUIPMENT_LABEL[value] ?? value;
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1);
};

export function ExerciseSearch({
  onPick,
  limit = 8,
  dragType,
  autoFocus,
  purpose = 'añadir',
}: {
  onPick: (exercise: Exercise) => void;
  limit?: number;
  /** When set, results can also be dragged; the drop target reads this data type. */
  dragType?: string;
  /** Puts the cursor in the search box as soon as it appears. */
  autoFocus?: boolean;
  /** What picking a result does, for the label of the search box. */
  purpose?: string;
}) {
  const list = useRef<HTMLUListElement>(null);
  const avoided = useContext(AthleteAvoided);
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
  // Every word typed has to appear, in any order: "curl bi" finds "Curl de Bíceps".
  const words = normalizeString(query.trim()).split(/\s+/).filter(Boolean);
  const results = all
    .filter((ex) => {
      if (equipment && ex.equipment !== equipment) return false;
      if (favorites && !itemFor(ex.id)?.favorite) return false;
      const text = normalizeString([ex.name, ...(ex.tags ?? [])].join(' '));
      return words.every((word) => text.includes(word));
    })
    .sort(
      (a, b) =>
        Number(!!itemFor(b.id)?.favorite) - Number(!!itemFor(a.id)?.favorite) ||
        (itemFor(b.id)?.lastUsed ?? '').localeCompare(itemFor(a.id)?.lastUsed ?? ''),
    )
    .slice(0, limit);
  const pick = (ex: Exercise) => {
    onPick(ex);
    setQuery('');
    if (items.isSuccess)
      mark.mutate({ ...defaultItem('EXERCISE', ex.id), ...itemFor(ex.id), used: true });
  };
  const focusResult = (index: number) =>
    list.current?.querySelectorAll<HTMLButtonElement>('[data-result]')[index]?.focus();
  return (
    <div className="exs">
      <label className="exs-field">
        <Search size={16} aria-hidden />
        <input
          type="search"
          autoFocus={autoFocus}
          aria-label={`Buscar ejercicio para ${purpose}`}
          placeholder="Nombre o etiqueta del ejercicio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim() && results[0]) {
              e.preventDefault();
              pick(results[0]);
            } else if (e.key === 'ArrowDown' && results.length) {
              e.preventDefault();
              focusResult(0);
            }
          }}
        />
      </label>
      <div className="exs-filters">
        <Select
          className="exs-equipment"
          aria-label="Material"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        >
          <option value="">Todo el material</option>
          {[...new Set(all.map((ex) => ex.equipment))].sort().map((value) => (
            <option key={value} value={value}>
              {equipmentLabel(value)}
            </option>
          ))}
        </Select>
        <button
          type="button"
          className="exs-chip"
          aria-pressed={favorites}
          onClick={() => setFavorites(!favorites)}
        >
          <Star size={14} fill={favorites ? 'currentColor' : 'none'} aria-hidden /> Solo favoritos
        </button>
      </div>
      <p className="exs-hint">
        {query.trim() && results[0]
          ? `Intro añade «${results[0].name}» · flecha abajo para recorrer`
          : 'Favoritos y recientes primero'}
      </p>
      <ul ref={list} className="exs-results" aria-label="Resultados">
        {!results.length && <li className="exs-none">Nada coincide con esos filtros.</li>}
        {results.map((ex, index) => {
          const favorite = itemFor(ex.id)?.favorite ?? false;
          const vetoed = avoided.some((item) => item.exerciseId === ex.id);
          return (
            <li
              key={ex.id}
              className="exs-row"
              draggable={!!dragType}
              onDragStart={(e) => {
                if (!dragType) return;
                e.dataTransfer.setData(
                  dragType,
                  JSON.stringify({ kind: 'exercise', id: ex.id, name: ex.name }),
                );
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <button
                type="button"
                data-result
                className="exs-pick"
                aria-label={ex.name}
                aria-describedby={`exs-meta-${ex.id}`}
                onClick={() => pick(ex)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                  e.preventDefault();
                  focusResult(index + (e.key === 'ArrowDown' ? 1 : -1));
                }}
              >
                <span className="exs-thumb" aria-hidden="true">
                  {ex.gifUrl ? (
                    <img src={ex.gifUrl} alt="" loading="lazy" />
                  ) : (
                    <Dumbbell size={15} />
                  )}
                </span>
                <span className="exs-name">
                  {ex.name}
                  <small id={`exs-meta-${ex.id}`} data-vetoed={vetoed || undefined}>
                    {vetoed
                      ? 'Vetado para este atleta'
                      : `${equipmentLabel(ex.equipment)}${ex.custom ? ' · propio' : ''}`}
                  </small>
                </span>
                <Plus size={16} aria-hidden />
              </button>
              <button
                type="button"
                className="exs-star"
                aria-label={`Favorito: ${ex.name}`}
                aria-pressed={favorite}
                disabled={!items.isSuccess || mark.isPending}
                onClick={() =>
                  mark.mutate(
                    { ...defaultItem('EXERCISE', ex.id), ...itemFor(ex.id), favorite: !favorite },
                    {
                      onError: (error) =>
                        toast.error(apiErrorMessage(error, 'No se pudo guardar el favorito')),
                    },
                  )
                }
              >
                <Star size={15} fill={favorite ? 'currentColor' : 'none'} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
