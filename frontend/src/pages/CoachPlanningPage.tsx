import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Copy, Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import { apiErrorMessage, formatCoachDate, personName, useCoachClients } from '../lib/coach/api';
import {
  useCoachPrograms,
  useDuplicateProgram,
  type ProgramSummary,
} from '../lib/coach/coachPrograms';
import { programCategory, useLibraryItems, useSaveLibraryItem } from '../lib/coach/library';
import { useNutritionTemplates } from '../lib/coach/nutritionTemplates';
import { useCoachRecipes } from '../lib/coach/coachRecipes';
import { clientHref } from '../lib/coach/workspace';
import '../styles/coach-library.css';

const TABS = [
  {
    id: 'sesiones',
    label: 'Sesiones',
    create: 'Nueva sesión',
    to: '/entrenador/programas/nuevo?tipo=sesion',
  },
  {
    id: 'semanas',
    label: 'Semanas',
    create: 'Nueva semana',
    to: '/entrenador/programas/nuevo?tipo=semana',
  },
  {
    id: 'programas',
    label: 'Programas',
    create: 'Nuevo programa',
    to: '/entrenador/programas/nuevo',
  },
  { id: 'nutricion', label: 'Nutrición', create: 'Nueva pauta', to: '/entrenador/pautas/nueva' },
  { id: 'recetas', label: 'Recetas', create: 'Nueva receta', to: '/entrenador/recetas' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const MANAGE: Record<TabId, { to: string; label: string }> = {
  sesiones: { to: '/entrenador/programas', label: 'Etiquetas, favoritos y más filtros' },
  semanas: { to: '/entrenador/programas', label: 'Etiquetas, favoritos y más filtros' },
  programas: { to: '/entrenador/programas', label: 'Etiquetas, favoritos y más filtros' },
  nutricion: { to: '/entrenador/pautas', label: 'Gestionar pautas' },
  recetas: { to: '/entrenador/recetas', label: 'Gestionar recetas' },
};

const EMPTY: Record<TabId, string> = {
  sesiones: 'Aún no has guardado ninguna sesión suelta.',
  semanas: 'Aún no has guardado ninguna semana.',
  programas: 'Aún no has guardado ningún programa.',
  nutricion: 'Aún no has guardado ninguna pauta de nutrición.',
  recetas: 'Aún no has guardado ninguna receta.',
};

interface Row {
  id: string;
  name: string;
  to: string;
  meta: string;
  draft?: boolean;
  duplicable?: boolean;
  apply?: 'training' | 'nutrition';
}
interface Applying {
  row: Row;
  kind: 'training' | 'nutrition';
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function programMeta(program: ProgramSummary, tab: TabId) {
  const days = plural(program.dayCount, 'sesión', 'sesiones');
  const size =
    tab === 'sesiones'
      ? ''
      : tab === 'semanas'
        ? days
        : `${plural(program.weeks, 'semana', 'semanas')} · ${days}`;
  return [size, `Editado el ${formatCoachDate(program.updatedAt)}`].filter(Boolean).join(' · ');
}

function ApplyDialog({ applying, onClose }: { applying: Applying; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const clients = useCoachClients(true);
  const training = applying.kind === 'training';
  const allowed = (clients.data ?? [])
    .filter((c) => (training ? c.permissions.editTraining : c.permissions.editNutrition))
    .sort((a, b) => personName(a.client).localeCompare(personName(b.client), 'es'));

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }, []);

  return (
    <dialog
      ref={ref}
      className="coach-library-dialog"
      aria-labelledby="coach-library-apply-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <h2 id="coach-library-apply-title">Aplicar «{applying.row.name}»</h2>
        <button type="button" className="coach-library-close" aria-label="Cerrar" onClick={onClose}>
          <X size={18} aria-hidden />
        </button>
      </header>
      <p>
        {training
          ? 'Elige al atleta. Verás el programa antes de asignarlo y podrás fijar la fecha de inicio.'
          : 'Elige al atleta. Se abrirá su nutrición para cargar esta pauta y ajustarla antes de publicar.'}
      </p>
      {clients.isLoading ? (
        <p role="status">Cargando atletas…</p>
      ) : clients.isError ? (
        <p role="alert">No se pudieron cargar tus atletas. Cierra y vuelve a intentarlo.</p>
      ) : allowed.length === 0 ? (
        <p className="coach-library-empty">
          {training
            ? 'Ningún atleta te ha dado permiso para pautar su entrenamiento.'
            : 'Ningún atleta te ha dado permiso para pautar su nutrición.'}
        </p>
      ) : (
        <ul>
          {allowed.map((c) => (
            <li key={c.linkId}>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    training
                      ? `${clientHref(c.linkId, 'entrenamiento')}&programa=${encodeURIComponent(applying.row.id)}`
                      : `${clientHref(c.linkId, 'nutricion')}&pauta=${encodeURIComponent(applying.row.id)}`,
                  )
                }
              >
                {personName(c.client)}
                <ArrowUpRight size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
}

export default function CoachPlanningPage() {
  const [params, setParams] = useSearchParams();
  const tab: TabId = TABS.find((t) => t.id === params.get('pestana'))?.id ?? 'sesiones';
  const current = TABS.find((t) => t.id === tab)!;
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState<Applying | null>(null);
  const programs = useCoachPrograms();
  const items = useLibraryItems();
  const templates = useNutritionTemplates();
  const recipes = useCoachRecipes();
  const duplicate = useDuplicateProgram();
  const saveItem = useSaveLibraryItem();

  const tabOf = (program: ProgramSummary): TabId => {
    const saved = items.data?.find((i) => i.type === 'PROGRAM' && i.id === program.id)?.category;
    const category = saved && saved !== 'EXERCISE' ? saved : programCategory(program);
    return category === 'SESSION' ? 'sesiones' : category === 'WEEK' ? 'semanas' : 'programas';
  };
  const programRows = (id: TabId): Row[] =>
    (programs.data ?? [])
      .filter((p) => tabOf(p) === id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        to: `/entrenador/programas/${p.id}`,
        meta: programMeta(p, id),
        draft: p.status === 'DRAFT',
        duplicable: true,
        apply: p.status === 'DRAFT' ? undefined : 'training',
      }));
  const rowsByTab: Record<TabId, Row[]> = {
    sesiones: programRows('sesiones'),
    semanas: programRows('semanas'),
    programas: programRows('programas'),
    nutricion: (templates.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      to: `/entrenador/pautas/${t.id}`,
      meta: `${t.trainingKcal} kcal entreno · ${t.restKcal} kcal descanso`,
      apply: 'nutrition',
    })),
    recetas: (recipes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      to: '/entrenador/recetas',
      meta: `${r.kcal} kcal · P ${r.protein} · C ${r.carbs} · G ${r.fat} g por ración`,
    })),
  };
  const query = tab === 'nutricion' ? templates : tab === 'recetas' ? recipes : programs;
  const term = search.trim().toLocaleLowerCase('es');
  const rows = rowsByTab[tab].filter((r) => r.name.toLocaleLowerCase('es').includes(term));

  const select = (id: TabId) => {
    const next = new URLSearchParams(params);
    setSearch('');
    if (id === 'sesiones') next.delete('pestana');
    else next.set('pestana', id);
    setParams(next, { replace: true });
  };

  return (
    <CoachWorkspace>
      <CoachPageHeader
        title="Biblioteca"
        description="Lo que preparas una vez y aplicas a cualquier atleta."
      >
        <Link className="btn btn-primary" to={current.to}>
          <Plus size={16} aria-hidden /> {current.create}
        </Link>
      </CoachPageHeader>
      <div className="coach-library-tabs" role="tablist" aria-label="Tipo de recurso">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`biblioteca-tab-${t.id}`}
            aria-selected={t.id === tab}
            aria-controls="biblioteca-panel"
            tabIndex={t.id === tab ? 0 : -1}
            onClick={() => select(t.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              const index = TABS.findIndex((x) => x.id === t.id);
              const next =
                TABS[(index + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length];
              select(next.id);
              document.getElementById(`biblioteca-tab-${next.id}`)?.focus();
            }}
          >
            {t.label}
            <span>{rowsByTab[t.id].length}</span>
          </button>
        ))}
      </div>
      <div
        id="biblioteca-panel"
        role="tabpanel"
        aria-labelledby={`biblioteca-tab-${tab}`}
        className="coach-library-panel"
      >
        <label className="coach-search">
          <Search size={18} aria-hidden />
          <span className="sr-only">Buscar en {current.label.toLowerCase()}</span>
          <input
            type="search"
            placeholder="Buscar por nombre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {query.isLoading ? (
          <p role="status" className="coach-library-empty">
            Cargando…
          </p>
        ) : query.isError ? (
          <p role="alert" className="coach-library-empty">
            No se pudo cargar esta lista. Recarga la página para volver a intentarlo.
          </p>
        ) : rows.length === 0 ? (
          <p className="coach-library-empty">
            {term ? `Nada coincide con «${search.trim()}».` : EMPTY[tab]}
          </p>
        ) : (
          <ul className="coach-library-list">
            {rows.map((row) => (
              <li key={row.id}>
                <Link to={row.to} className="coach-library-name">
                  <strong>{row.name}</strong>
                  <small>
                    {row.draft && <em>Borrador</em>}
                    {row.draft && row.meta ? ' · ' : ''}
                    {row.meta}
                  </small>
                </Link>
                {row.duplicable && (
                  <button
                    type="button"
                    className="coach-library-icon"
                    aria-label={`Duplicar ${row.name}`}
                    title="Duplicar"
                    disabled={duplicate.isPending}
                    onClick={() =>
                      duplicate.mutate(row.id, {
                        onSuccess: (copy) => {
                          // The copy stays where its original is filed, not where its size would put it.
                          const source = items.data?.find(
                            (i) => i.type === 'PROGRAM' && i.id === row.id,
                          );
                          if (source && copy.id)
                            saveItem.mutate({
                              type: 'PROGRAM',
                              id: copy.id,
                              favorite: false,
                              category: source.category,
                              tags: source.tags,
                              minutes: source.minutes,
                              equipment: source.equipment,
                              lastUsed: null,
                            });
                          toast.success(`Copia creada como borrador: «${copy.name}»`);
                        },
                        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo duplicar')),
                      })
                    }
                  >
                    <Copy size={16} aria-hidden />
                  </button>
                )}
                {row.apply && (
                  <button
                    type="button"
                    className="coach-library-apply"
                    aria-label={`Aplicar ${row.name} a un atleta`}
                    onClick={() => setApplying({ row, kind: row.apply! })}
                  >
                    Aplicar a…
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="coach-library-more">
          <Link to={MANAGE[tab].to}>
            {MANAGE[tab].label} <ArrowUpRight size={14} aria-hidden />
          </Link>
          {(tab === 'sesiones' || tab === 'semanas' || tab === 'programas') &&
            rowsByTab[tab].some((r) => r.draft) && (
              <span>Los borradores se pueden aplicar cuando los marcas como listos.</span>
            )}
        </p>
      </div>
      {applying && <ApplyDialog applying={applying} onClose={() => setApplying(null)} />}
    </CoachWorkspace>
  );
}
