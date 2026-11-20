import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Copy, Plus, Search, Star, Tag, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import { apiErrorMessage, formatCoachDate, personName, useCoachClients } from '../lib/coach/api';
import {
  useCoachPrograms,
  useDeleteProgram,
  useDuplicateProgram,
  type ProgramSummary,
} from '../lib/coach/coachPrograms';
import {
  defaultItem,
  programCategory,
  useLibraryItems,
  useSaveLibraryItem,
  type LibraryItem,
} from '../lib/coach/library';
import { useDeleteNutritionTemplate, useNutritionTemplates } from '../lib/coach/nutritionTemplates';
import { useCoachRecipes, useDeleteRecipe } from '../lib/coach/coachRecipes';
import { LibraryItemFields } from '../components/coach/LibraryItemFields';
import { confirmAction } from '../lib/confirmation';
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
  { id: 'recetas', label: 'Recetas', create: 'Nueva receta', to: '/entrenador/recetas?nueva=1' },
] as const;
type TabId = (typeof TABS)[number]['id'];

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
  /** Extra text the search looks into, besides the name. */
  words?: string;
  draft?: boolean;
  program?: ProgramSummary;
  apply?: 'training' | 'nutrition';
  remove: () => void;
}
interface Applying {
  row: Row;
  kind: 'training' | 'nutrition';
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function programMeta(program: ProgramSummary, tab: TabId, item?: LibraryItem) {
  const days = plural(program.dayCount, 'sesión', 'sesiones');
  const size =
    tab === 'sesiones'
      ? ''
      : tab === 'semanas'
        ? days
        : `${plural(program.weeks, 'semana', 'semanas')} · ${days}`;
  return [
    size,
    item?.minutes ? `${item.minutes} min` : '',
    item?.equipment ?? '',
    ...(item?.tags ?? []).map((tag) => `#${tag}`),
    `Editado el ${formatCoachDate(program.updatedAt)}`,
  ]
    .filter(Boolean)
    .join(' · ');
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
                      : `${clientHref(c.linkId, 'pauta')}&pauta=${encodeURIComponent(applying.row.id)}`,
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
  const training = tab === 'sesiones' || tab === 'semanas' || tab === 'programas';
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(false);
  const [organizing, setOrganizing] = useState<string | null>(null);
  const [applying, setApplying] = useState<Applying | null>(null);
  const programs = useCoachPrograms();
  const items = useLibraryItems();
  const templates = useNutritionTemplates();
  const recipes = useCoachRecipes();
  const duplicate = useDuplicateProgram();
  const saveItem = useSaveLibraryItem();
  const removeProgram = useDeleteProgram();
  const removeTemplate = useDeleteNutritionTemplate();
  const removeRecipe = useDeleteRecipe();
  const removing = removeProgram.isPending || removeTemplate.isPending || removeRecipe.isPending;
  const failed = { onError: (e: unknown) => toast.error(apiErrorMessage(e, 'No se pudo borrar')) };

  const itemFor = (id: string) => items.data?.find((i) => i.type === 'PROGRAM' && i.id === id);
  const itemOf = (program: ProgramSummary): LibraryItem => ({
    ...defaultItem('PROGRAM', program.id),
    category: programCategory(program),
    ...itemFor(program.id),
  });
  const tabOf = (program: ProgramSummary): TabId => {
    const saved = itemFor(program.id)?.category;
    const category = saved && saved !== 'EXERCISE' ? saved : programCategory(program);
    return category === 'SESSION' ? 'sesiones' : category === 'WEEK' ? 'semanas' : 'programas';
  };
  const confirmed = async (title: string, description: string, confirmLabel: string) =>
    confirmAction({ title, description, confirmLabel, destructive: true });
  const programRows = (id: TabId): Row[] =>
    (programs.data ?? [])
      .filter((p) => tabOf(p) === id)
      .map((p) => {
        const item = itemFor(p.id);
        return {
          id: p.id,
          name: p.name,
          to: `/entrenador/programas/${p.id}`,
          meta: programMeta(p, id, item),
          words: [...(item?.tags ?? []), item?.equipment ?? ''].join(' '),
          draft: p.status === 'DRAFT',
          program: p,
          apply: p.status === 'DRAFT' ? undefined : 'training',
          remove: async () => {
            if (
              await confirmed(
                'Borrar de la biblioteca',
                `¿Borrar «${p.name}» de la biblioteca? Los atletas conservan sus copias. No se puede deshacer.`,
                'Borrar',
              )
            )
              removeProgram.mutate(p.id, failed);
          },
        };
      });
  const rowsByTab: Record<TabId, Row[]> = {
    sesiones: programRows('sesiones'),
    semanas: programRows('semanas'),
    programas: programRows('programas'),
    nutricion: (templates.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      to: `/entrenador/pautas/${encodeURIComponent(t.id)}`,
      meta: `${t.trainingKcal} kcal entreno · ${t.restKcal} kcal descanso`,
      apply: 'nutrition',
      remove: async () => {
        if (
          await confirmed(
            'Borrar pauta de la biblioteca',
            `¿Borrar «${t.name}» de la biblioteca? Las pautas de tus atletas se conservarán.`,
            'Borrar pauta',
          )
        )
          removeTemplate.mutate(t, {
            onError: (e) => {
              toast.error(apiErrorMessage(e, 'No se pudo borrar la pauta.'));
              void templates.refetch();
            },
          });
      },
    })),
    recetas: (recipes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      to: `/entrenador/recetas?editar=${encodeURIComponent(r.id)}`,
      meta: `${r.kcal} kcal · P ${r.protein} · C ${r.carbs} · G ${r.fat} g por ración`,
      remove: async () => {
        if (
          await confirmed(
            'Borrar receta',
            `¿Borrar «${r.name}»? No se puede deshacer.`,
            'Borrar receta',
          )
        )
          removeRecipe.mutate(r.id, failed);
      },
    })),
  };
  const query = tab === 'nutricion' ? templates : tab === 'recetas' ? recipes : programs;
  const term = search.trim().toLocaleLowerCase('es');
  const rows = rowsByTab[tab].filter(
    (r) =>
      `${r.name} ${r.words ?? ''}`.toLocaleLowerCase('es').includes(term) &&
      (!training || !favorites || itemFor(r.id)?.favorite),
  );

  const select = (id: TabId) => {
    const next = new URLSearchParams(params);
    setSearch('');
    setOrganizing(null);
    if (id === 'sesiones') next.delete('pestana');
    else next.set('pestana', id);
    setParams(next, { replace: true });
  };

  const copy = (row: Row) =>
    duplicate.mutate(row.id, {
      onSuccess: (made) => {
        // The copy stays where its original is filed, not where its size would put it.
        const source = itemFor(row.id);
        if (source && made.id)
          saveItem.mutate({ ...source, id: made.id, favorite: false, lastUsed: null });
        toast.success(`Copia creada como borrador: «${made.name}»`);
      },
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo duplicar')),
    });

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
        <div className="coach-library-tools" data-tour="library-filters">
          <label className="coach-search">
            <Search size={18} aria-hidden />
            <span className="sr-only">Buscar en {current.label.toLowerCase()}</span>
            <input
              type="search"
              placeholder={
                training ? 'Buscar por nombre, etiqueta o material' : 'Buscar por nombre'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {training && (
            <button
              type="button"
              className="coach-chip"
              aria-pressed={favorites}
              onClick={() => setFavorites(!favorites)}
            >
              <Star size={14} fill={favorites ? 'currentColor' : 'none'} aria-hidden /> Favoritos
            </button>
          )}
        </div>
        {query.isLoading ? (
          <p role="status" className="coach-library-empty">
            Cargando…
          </p>
        ) : query.isError ? (
          <p role="alert" className="coach-library-empty">
            No se pudo cargar esta lista.{' '}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void query.refetch()}
            >
              Reintentar
            </button>
          </p>
        ) : rows.length === 0 ? (
          <div className="coach-library-empty">
            <p>
              {term
                ? `Nada coincide con «${search.trim()}».`
                : training && favorites
                  ? 'Aún no has marcado ningún favorito aquí.'
                  : EMPTY[tab]}
            </p>
          </div>
        ) : (
          <ul className="coach-library-list">
            {rows.map((row) => (
              <li key={row.id}>
                {row.program && (
                  <button
                    type="button"
                    className="coach-library-icon coach-library-star"
                    aria-label={`Favorito: ${row.name}`}
                    aria-pressed={itemFor(row.id)?.favorite ?? false}
                    disabled={saveItem.isPending || !items.isSuccess}
                    onClick={() => {
                      const item = itemOf(row.program!);
                      saveItem.mutate(
                        { ...item, favorite: !item.favorite },
                        {
                          onError: (e) =>
                            toast.error(apiErrorMessage(e, 'No se pudo guardar el favorito')),
                        },
                      );
                    }}
                  >
                    <Star
                      size={17}
                      fill={itemFor(row.id)?.favorite ? 'currentColor' : 'none'}
                      aria-hidden
                    />
                  </button>
                )}
                <Link to={row.to} className="coach-library-name">
                  <strong>{row.name}</strong>
                  <small>
                    {row.draft && <em>Borrador</em>}
                    {row.draft && row.meta ? ' · ' : ''}
                    {row.meta}
                  </small>
                </Link>
                <div className="coach-library-actions">
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
                  {row.program && (
                    <>
                      <button
                        type="button"
                        className="coach-library-icon"
                        aria-label={`Clasificar ${row.name}`}
                        title="Tipo, etiquetas, material y duración"
                        aria-expanded={organizing === row.id}
                        disabled={!items.isSuccess}
                        onClick={() => setOrganizing(organizing === row.id ? null : row.id)}
                      >
                        <Tag size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="coach-library-icon"
                        aria-label={`Duplicar ${row.name}`}
                        title="Duplicar"
                        disabled={duplicate.isPending}
                        onClick={() => copy(row)}
                      >
                        <Copy size={16} aria-hidden />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="coach-library-icon"
                    aria-label={`Borrar ${row.name}`}
                    title="Borrar"
                    disabled={removing}
                    onClick={row.remove}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
                {row.program && organizing === row.id && (
                  <LibraryItemFields
                    key={JSON.stringify(itemFor(row.id))}
                    item={itemOf(row.program)}
                    onDone={() => setOrganizing(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {training && rowsByTab[tab].some((r) => r.draft) && (
          <p className="coach-library-more">
            Los borradores se pueden aplicar cuando los marcas como listos.
          </p>
        )}
      </div>
      {applying && <ApplyDialog applying={applying} onClose={() => setApplying(null)} />}
    </CoachWorkspace>
  );
}
