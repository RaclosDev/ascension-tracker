import { Search } from 'lucide-react';
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from '@/lib/workout/equipmentOptions';
import type { Equipment, MuscleGroup } from '@/lib/workout/types';
import type { ExerciseTabFilter } from '@/hooks/workout/useExerciseFilters';
import { Select } from '@/components/ui/select';

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
    <div className="ex-filters">
      <div className="ex-search">
        <label htmlFor="exercise-search-input" className="sr-only">
          Buscar ejercicios
        </label>
        <Search
          size={16}
          className="ex-search-icon"
          aria-hidden="true"
        />
        <input
          id="exercise-search-input"
          type="search"
          aria-label="Buscar ejercicio por nombre"
          className="form-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ejercicio"
        />
      </div>

      <div className="ex-selects">
        <label htmlFor="filter-muscle-select" className="sr-only">
          Filtrar por grupo muscular
        </label>
        <Select
          id="filter-muscle-select"
          aria-label="Filtrar por grupo muscular"
          className="form-input"
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | 'ALL')}
        >
          <option value="ALL">Músculo</option>
          {MUSCLE_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
        <label htmlFor="filter-equipment-select" className="sr-only">
          Filtrar por equipamiento
        </label>
        <Select
          id="filter-equipment-select"
          aria-label="Filtrar por equipamiento"
          className="form-input"
          value={filterEquip}
          onChange={(e) => setFilterEquip(e.target.value as Equipment | 'ALL')}
        >
          <option value="ALL">Material</option>
          {EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id)).map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="ex-kinds" role="tablist" aria-label="Filtro de ejercicios">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className="ex-kind"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
