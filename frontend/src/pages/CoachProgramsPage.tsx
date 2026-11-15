import { Star } from 'lucide-react';
import {
  CATEGORIES,
  defaultItem,
  programCategory,
  useLibraryItems,
  useSaveLibraryItem,
} from '../lib/coach/library';
import { LibraryItemFields } from '../components/coach/LibraryItemFields';
import { confirmAction } from '../lib/confirmation';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage, formatCoachDate } from '../lib/coach/api';
import { CoachPageHeader } from '../components/coach/CoachWorkspace';
import {
  useCoachPrograms,
  useDeleteProgram,
  useDuplicateProgram,
} from '../lib/coach/coachPrograms';

/** The coach's program library: the starting point for building and, later, assigning plans. */
export default function CoachProgramsPage() {
  const programs = useCoachPrograms();
  const duplicate = useDuplicateProgram();
  const remove = useDeleteProgram();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [favorites, setFavorites] = useState(false);
  const [maxMinutes, setMaxMinutes] = useState('');
  const [material, setMaterial] = useState('');
  const items = useLibraryItems();
  const mark = useSaveLibraryItem();
  const itemFor = (id: string) => items.data?.find((i) => i.type === 'PROGRAM' && i.id === id);
  const filtered = programs.data?.filter(
    (program) =>
      [program.name, ...(itemFor(program.id)?.tags ?? [])]
        .join(' ')
        .toLocaleLowerCase('es')
        .includes(search.trim().toLocaleLowerCase('es')) &&
      (!favorites || itemFor(program.id)?.favorite) &&
      (!maxMinutes ||
        (itemFor(program.id)?.minutes != null &&
          itemFor(program.id)!.minutes! <= Number(maxMinutes))) &&
      (!material ||
        itemFor(program.id)
          ?.equipment.toLocaleLowerCase()
          .includes(material.toLocaleLowerCase())) &&
      (category === 'ALL' ||
        (itemFor(program.id)?.category ?? programCategory(program)) === category) &&
      (status === 'ALL' || (program.status ?? 'READY') === status),
  );

  return (
    <div className="fade-in coach-page coach-workspace">
      <Link to="/entrenador/planificacion" className="coach-back-link">
        <ArrowLeft size={16} aria-hidden /> Volver a biblioteca
      </Link>
      <CoachPageHeader
        title="Biblioteca de entrenamiento"
        description="Sesiones cortas, bloques, semanas y programas que puedes reutilizar y personalizar para cada atleta."
      >
        <div className="flex flex-wrap gap-2">
          <Link to="/entrenador/programas/nuevo?tipo=sesion" className="btn btn-secondary">
            <Plus size={16} aria-hidden /> Nueva sesión
          </Link>
          <Link to="/entrenador/programas/nuevo?tipo=semana" className="btn btn-secondary">
            <Plus size={16} aria-hidden /> Nueva semana
          </Link>
          <Link to="/entrenador/programas/nuevo" className="btn btn-primary">
            <Plus size={16} aria-hidden /> Nuevo programa
          </Link>
        </div>
      </CoachPageHeader>
      <div
        data-tour="library-filters"
        className="grid gap-3 mb-4 items-end sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="flex flex-col gap-1 min-w-0">
          <span>Buscar programa o etiqueta</span>
          <input
            className="form-input min-h-11"
            aria-label="Buscar programa"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar programa"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span>Estado</span>
          <select
            className="form-input min-h-11"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">Todos</option>
            <option value="DRAFT">Borradores</option>
            <option value="READY">Listos para asignar</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          Tipo
          <select
            className="form-input min-h-11"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ALL">Todos</option>
            {Object.entries(CATEGORIES)
              .filter(([id]) => id !== 'EXERCISE')
              .map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
          </select>
        </label>
        <label className="flex gap-2 items-center min-h-11">
          <input
            type="checkbox"
            checked={favorites}
            onChange={(e) => setFavorites(e.target.checked)}
          />
          Favoritos
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          Material
          <input
            className="form-input min-h-11"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          Hasta (min)
          <input
            className="form-input min-h-11"
            type="number"
            min={1}
            max={300}
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(e.target.value)}
          />
        </label>
      </div>

      {programs.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {items.isError && (
        <p role="alert">
          No se pudieron cargar favoritos y filtros.{' '}
          <button type="button" onClick={() => void items.refetch()}>
            Reintentar
          </button>
        </p>
      )}
      {programs.isError && (
        <div role="alert">
          {apiErrorMessage(programs.error, 'No se pudieron cargar tus programas.')}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void programs.refetch()}
          >
            Reintentar
          </button>
        </div>
      )}
      {programs.data?.length === 0 && (
        <section className="card">
          <p style={{ color: 'var(--text-secondary)' }}>
            Aún no tienes programas. Crea uno con sus semanas, días y ejercicios pautados para
            asignarlo después a tus atletas.
          </p>
        </section>
      )}

      {programs.data && programs.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {filtered?.map((program) => (
            <li key={program.id} className="card flex flex-wrap items-center justify-between gap-3">
              <Link to={`/entrenador/programas/${program.id}`} className="min-w-0 flex-1">
                <div className="font-bold text-foreground break-words">{program.name}</div>
                <span className="text-sm">
                  {program.status === 'DRAFT' ? 'Borrador' : 'Listo para asignar'}
                </span>
                <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                  {program.weeks} {program.weeks === 1 ? 'semana' : 'semanas'} · {program.dayCount}{' '}
                  {program.dayCount === 1 ? 'día' : 'días'} · editado el{' '}
                  {formatCoachDate(program.updatedAt)}
                </div>
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Favorito: ${program.name}`}
                  aria-pressed={itemFor(program.id)?.favorite ?? false}
                  disabled={mark.isPending || items.isPending || items.isError}
                  onClick={() =>
                    mark.mutate(
                      {
                        ...defaultItem('PROGRAM', program.id),
                        category: programCategory(program),
                        ...itemFor(program.id),
                        favorite: !itemFor(program.id)?.favorite,
                      },
                      {
                        onError: (e) =>
                          toast.error(apiErrorMessage(e, 'No se pudo guardar el favorito')),
                      },
                    )
                  }
                >
                  <Star
                    size={16}
                    fill={itemFor(program.id)?.favorite ? 'currentColor' : 'none'}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Duplicar ${program.name}`}
                  disabled={duplicate.isPending}
                  onClick={() =>
                    duplicate.mutate(program.id, {
                      onSuccess: () => toast.success('Programa duplicado'),
                      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo duplicar')),
                    })
                  }
                >
                  <Copy size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Borrar ${program.name}`}
                  disabled={remove.isPending}
                  onClick={async () => {
                    if (
                      !(await confirmAction({
                        title: 'Borrar programa de biblioteca',
                        description: `¿Borrar «${program.name}» de la biblioteca? Los atletas conservan sus copias. No se puede deshacer.`,
                        confirmLabel: 'Borrar programa',
                        destructive: true,
                      }))
                    )
                      return;
                    remove.mutate(program.id, {
                      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo borrar')),
                    });
                  }}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
              {!items.isPending && !items.isError && (
                <LibraryItemFields
                  key={JSON.stringify(itemFor(program.id))}
                  item={{
                    ...defaultItem('PROGRAM', program.id),
                    category: programCategory(program),
                    ...itemFor(program.id),
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {programs.data && programs.data.length > 0 && filtered?.length === 0 && (
        <p role="status">No hay programas con esos filtros.</p>
      )}
    </div>
  );
}
