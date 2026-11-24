import { LayoutGrid, List, Search, X } from 'lucide-react';
import { Select } from '@/components/ui/select';

interface FoodFiltersBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchFilter: string;
  setSearchFilter: (val: string) => void;
  viewMode: string;
  setViewMode: (val: string) => void;
  totalResults: number;
  filteredRecentCount: number;
  filteredFoodsCount: number;
  filteredRecipesCount: number;
  macroFilter?: string;
  setMacroFilter?: (val: string) => void;
  sortBy?: string;
  setSortBy?: (val: string) => void;
}

const MACROS = [
  { id: 'all', label: 'Todos' },
  { id: 'protein', label: 'Proteína' },
  { id: 'carbs', label: 'Hidratos' },
  { id: 'fat', label: 'Grasa' },
];

export function FoodFiltersBar({
  searchQuery,
  setSearchQuery,
  searchFilter,
  setSearchFilter,
  viewMode,
  setViewMode,
  totalResults,
  filteredRecentCount,
  filteredFoodsCount,
  filteredRecipesCount,
  macroFilter,
  setMacroFilter,
  sortBy,
  setSortBy,
}: FoodFiltersBarProps) {
  const kinds = [
    { id: 'all', label: 'Todo', count: totalResults },
    { id: 'foods', label: 'Alimentos', count: filteredFoodsCount },
    { id: 'recipes', label: 'Recetas', count: filteredRecipesCount },
    { id: 'recent', label: 'Recientes', count: filteredRecentCount },
  ];
  const showsFoods = searchFilter === 'all' || searchFilter === 'foods';

  return (
    <div className="mf-filters">
      <div className="mf-search">
        <Search size={16} aria-hidden="true" className="mf-search-icon" />
        <input
          type="search"
          className="form-input"
          aria-label="Buscar en mis alimentos"
          placeholder="Buscar alimento o receta"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="icon-btn mf-search-clear"
            aria-label="Borrar la búsqueda"
            onClick={() => setSearchQuery('')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mf-chips" role="group" aria-label="Qué mostrar">
        {kinds.map((kind) => (
          <button
            key={kind.id}
            type="button"
            className="mf-chip"
            aria-pressed={searchFilter === kind.id}
            onClick={() => setSearchFilter(kind.id)}
          >
            {kind.label}
            <span className="mf-chip-count tabular-nums">{kind.count}</span>
          </button>
        ))}
      </div>

      {showsFoods && macroFilter && setMacroFilter && sortBy && setSortBy && (
        <div className="mf-refine">
          <div className="mf-chips" role="group" aria-label="Macro predominante">
            <span className="mf-refine-label">Rico en</span>
            {MACROS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="mf-chip mf-chip-sm"
                aria-pressed={macroFilter === m.id}
                onClick={() => setMacroFilter(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mf-refine-end">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input mf-sort"
              aria-label="Ordenar alimentos"
            >
              <option value="recent">Más recientes</option>
              <option value="name_asc">Nombre (A-Z)</option>
            </Select>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="icon-btn mf-icon-btn mf-view-toggle"
              aria-label={viewMode === 'grid' ? 'Ver como lista' : 'Ver como cuadrícula'}
            >
              {viewMode === 'grid' ? (
                <List size={16} aria-hidden="true" />
              ) : (
                <LayoutGrid size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      )}

      {searchQuery && (
        <p className="mf-results" role="status">
          <span>
            {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'} para «{searchQuery}»
          </span>
          <button
            type="button"
            className="wk-link"
            onClick={() => {
              setSearchQuery('');
              setSearchFilter('all');
            }}
          >
            Quitar filtros
          </button>
        </p>
      )}
    </div>
  );
}
