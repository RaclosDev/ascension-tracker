import { Search } from 'lucide-react';
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from '@/lib/workout/equipmentOptions';
import type { Equipment, MuscleGroup } from '@/lib/workout/types';
import type { ExerciseTabFilter } from '@/hooks/workout/useExerciseFilters';

export interface ExerciseFilterBarProps {
  query: string;
  setQuery: (q: string) => void;
  filter: ExerciseTabFilter;
  setFilter: (f: ExerciseTabFilter) => void;
  filterMuscle: MuscleGroup | 'ALL';
  setFilterMuscle: (m: MuscleGroup | 'ALL') => void;
  filterEquip: Equipment | 'ALL';
  setFilterEquip: (e: Equipment | 'ALL') => void;
  hiddenEquipments?: string[];
}

const TABS: readonly { id: ExerciseTabFilter; label: string }[] = [
  { id: 'basicos', label: 'Básicos' },
  { id: 'todos', label: 'Todos' },
  { id: 'custom', label: 'Personalizados' },
  { id: 'variantes', label: 'Variantes' },
];

export function ExerciseFilterBar({
  query,
  setQuery,
  filter,
  setFilter,
  filterMuscle,
  setFilterMuscle,
  filterEquip,
  setFilterEquip,
  hiddenEquipments = [],
}: ExerciseFilterBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <label htmlFor="exercise-search-input" className="sr-only">
          Buscar ejercicios
        </label>
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          id="exercise-search-input"
          type="search"
          aria-label="Buscar ejercicio por nombre"
          className="form-input w-full pl-8 pr-2 py-1.5 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar press, sentadilla"
        />
      </div>

      <div className="flex gap-2">
        <label htmlFor="filter-muscle-select" className="sr-only">
          Filtrar por grupo muscular
        </label>
        <select
          id="filter-muscle-select"
          aria-label="Filtrar por grupo muscular"
          className="form-input flex-1 p-1.5 text-xs"
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | 'ALL')}
        >
          <option value="ALL">Músculo (Todos)</option>
          {MUSCLE_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <label htmlFor="filter-equipment-select" className="sr-only">
          Filtrar por equipamiento
        </label>
        <select
          id="filter-equipment-select"
          aria-label="Filtrar por equipamiento"
          className="form-input flex-1 p-1.5 text-xs"
          value={filterEquip}
          onChange={(e) => setFilterEquip(e.target.value as Equipment | 'ALL')}
        >
          <option value="ALL">Material (Todos)</option>
          {EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id)).map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="flex bg-secondary p-1 rounded-lg"
        role="tablist"
        aria-label="Filtro de ejercicios"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-1 px-3 rounded-md text-xs font-semibold transition-all ${
              filter === tab.id ? 'bg-primary text-white' : 'text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
