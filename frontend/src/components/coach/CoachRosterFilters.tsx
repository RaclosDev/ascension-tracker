import { useState } from 'react';
import { Search } from 'lucide-react';
import { clientTasks } from '../../lib/coach/tasks';
import { followupSignals, type CoachRow } from '../../lib/coach/workspace';
import { SERVICE_LABELS } from '../../lib/coach/setup';

type Filter =
  | 'all'
  | 'attention'
  | 'checkin'
  | 'noProgram'
  | 'setup'
  | 'tasks'
  | 'waiting'
  | 'paused'
  | 'nextWeek';
export const ROSTER_FILTERS: {
  value: Filter;
  label: string;
  matches: (row: CoachRow) => boolean;
}[] = [
  { value: 'all', label: 'Todos', matches: () => true },
  {
    value: 'nextWeek',
    label: 'Semana por preparar',
    matches: (r) =>
      r.link.setup?.services.training === true &&
      (r.status?.nextWeekStatus === 'MISSING' || r.status?.nextWeekStatus === 'DRAFT'),
  },
  { value: 'paused', label: 'En pausa', matches: (r) => !!r.link.followup?.schedule.paused },
  { value: 'setup', label: 'Incorporación', matches: (r) => !r.link.setup?.reviewed },
  {
    value: 'tasks',
    label: 'Tareas del entrenador',
    matches: (r) => clientTasks(r).some((t) => t.owner === 'coach'),
  },
  {
    value: 'waiting',
    label: 'Pendiente del alumno',
    matches: (r) => clientTasks(r).some((t) => t.owner === 'client'),
  },
  {
    value: 'attention',
    label: 'Por revisar',
    matches: (r) => followupSignals(r.status).length > 0,
  },
  { value: 'checkin', label: 'Por responder', matches: (r) => (r.status?.pendingReplies ?? 0) > 0 },
  {
    value: 'noProgram',
    label: 'Sin programa',
    matches: (r) => !!r.status?.signals.some((s) => s.reason === 'NO_PROGRAM'),
  },
];

const QUICK_FILTERS: Filter[] = ['all', 'attention', 'checkin'];

export function CoachRosterFilters({
  rows,
  ready,
  params,
  update,
  clear,
}: {
  rows: CoachRow[];
  ready: boolean;
  params: URLSearchParams;
  update: (key: string, value: string) => void;
  clear: () => void;
}) {
  const filter = ROSTER_FILTERS.find((f) => f.value === params.get('filtro')) ?? ROSTER_FILTERS[0];
  const sort = params.get('orden') ?? 'priority';
  const service = params.get('servicio') ?? '';
  const showWeight = params.get('peso') === 'si';
  const viewOptions = [
    SERVICE_LABELS[service as keyof typeof SERVICE_LABELS],
    sort === 'name' ? 'Por nombre' : sort === 'recent' ? 'Altas recientes' : '',
    showWeight ? 'Peso visible' : '',
  ].filter(Boolean);
  const [expanded, setExpanded] = useState(false);
  const chip = (f: (typeof ROSTER_FILTERS)[number]) => (
    <button
      key={f.value}
      type="button"
      className="coach-chip"
      aria-pressed={filter.value === f.value}
      disabled={f.value !== 'all' && !ready}
      onClick={() => update('filtro', f.value === 'all' ? '' : f.value)}
    >
      {f.label}{' '}
      <span className="coach-chip-count">
        {f.value === 'all' || ready ? rows.filter(f.matches).length : '—'}
      </span>
    </button>
  );
  return (
    <section className="coach-roster-controls" aria-label="Buscar y filtrar alumnos">
      <label className="coach-search">
        <Search size={18} aria-hidden />
        <span className="sr-only">Buscar alumno</span>
        <input
          type="search"
          placeholder="Buscar por nombre"
          value={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value)}
        />
      </label>
      <div className="coach-chips" role="group" aria-label="Filtrar alumnos">
        {QUICK_FILTERS.map((value) => chip(ROSTER_FILTERS.find((f) => f.value === value)!))}
        {!expanded && !QUICK_FILTERS.includes(filter.value) && chip(filter)}
      </div>
      <details
        className="coach-filter-options"
        open={expanded}
        onToggle={(e) => setExpanded(e.currentTarget.open)}
      >
        <summary>
          Más filtros y vista
          {viewOptions.length > 0 && (
            <span className="coach-filter-selection">{viewOptions.join(' · ')}</span>
          )}
        </summary>
        <div className="coach-filter-content">
          <div className="coach-chips" role="group" aria-label="Otros filtros de alumnos">
            {ROSTER_FILTERS.filter((f) => !QUICK_FILTERS.includes(f.value)).map(chip)}
          </div>
          <div className="coach-list-controls">
            <label className="coach-sort">
              <span>Servicio</span>
              <select value={service} onChange={(e) => update('servicio', e.target.value)}>
                <option value="">Todos los servicios</option>
                {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="coach-sort">
              <span>Ordenar</span>
              <select value={sort} onChange={(e) => update('orden', e.target.value)}>
                <option value="priority">Prioridad</option>
                <option value="name">Nombre</option>
                <option value="recent">Altas recientes</option>
              </select>
            </label>
            <label className="coach-weight-toggle">
              <input
                type="checkbox"
                checked={showWeight}
                onChange={(e) => update('peso', e.target.checked ? 'si' : '')}
              />{' '}
              Mostrar peso
            </label>
          </div>
        </div>
      </details>
      {(params.get('q') || filter.value !== 'all' || viewOptions.length > 0) && (
        <button type="button" className="coach-text-button coach-clear-filters" onClick={clear}>
          Limpiar filtros
        </button>
      )}
    </section>
  );
}
