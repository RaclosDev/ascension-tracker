import { X, LayoutGrid, Clock, Apple, ChefHat, List } from 'lucide-react';

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
}

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
}: FoodFiltersBarProps) {
  return (
    <div
      className="card"
      style={{
        marginBottom: '1.25rem',
        padding: '0.85rem 1rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Buscar en recientes, alimentos o recetas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '2.4rem',
            paddingRight: searchQuery ? '2.4rem' : '0.85rem',
            height: '40px',
            fontSize: '0.88rem',
            borderRadius: '10px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          className="mobile-scroll-x"
          style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', flex: 1 }}
        >
          {[
            { id: 'all', icon: LayoutGrid, label: 'Todo', count: totalResults },
            { id: 'recent', icon: Clock, label: 'Recientes', count: filteredRecentCount },
            { id: 'foods', icon: Apple, label: 'Alimentos', count: filteredFoodsCount },
            { id: 'recipes', icon: ChefHat, label: 'Recetas', count: filteredRecipesCount },
          ].map((tab) => {
            const active = searchFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchFilter(tab.id)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: active
                    ? `1px solid var(--text-primary)`
                    : '1px solid var(--border-subtle)',
                  background: active ? 'var(--bg-glass-strong)' : 'var(--bg-primary)',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <tab.icon size={14} style={{ marginRight: '0.15rem' }} />
                  {active && (
                    <span style={{ marginLeft: '0.3rem' }} className="fade-in-anim">
                      {tab.label}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    opacity: 0.8,
                    background: active ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)',
                    padding: '0.05rem 0.3rem',
                    borderRadius: '4px',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="btn btn-secondary btn-sm"
          style={{
            padding: '0.3rem',
            width: '32px',
            height: '32px',
            flexShrink: 0,
            borderRadius: '8px',
          }}
        >
          {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
        </button>
      </div>
      {searchQuery && (
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>
            Resultados para "<strong>{searchQuery}</strong>": {totalResults} coincidencia
            {totalResults === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchFilter('all');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-carbs)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
}
