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
  const filtered = programs.data?.filter(
    (program) =>
      program.name.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')) &&
      (status === 'ALL' || (program.status ?? 'READY') === status),
  );

  return (
    <div className="fade-in coach-page coach-workspace">
      <Link
        to="/entrenador/planificacion"
        aria-label="Volver a planificación"
        className="btn btn-secondary w-fit"
      >
        <ArrowLeft size={16} aria-hidden /> Planificación
      </Link>
      <CoachPageHeader
        title="Biblioteca de programas"
        description="Prepara borradores y revisa cada programa antes de asignarlo. Las copias de tus alumnos conservan su versión."
      >
        <Link to="/entrenador/programas/nuevo" className="btn btn-primary">
          <Plus size={16} aria-hidden /> Nuevo programa
        </Link>
      </CoachPageHeader>
      <div className="coach-list-controls mb-4">
        <label className="coach-search">
          <span className="sr-only">Buscar programa</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar programa"
          />
        </label>
        <label className="coach-sort">
          <span>Estado</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Todos</option>
            <option value="DRAFT">Borradores</option>
            <option value="READY">Listos para asignar</option>
          </select>
        </label>
      </div>

      {programs.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
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
            asignarlo después a tus alumnos.
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
                  onClick={() => {
                    if (
                      !window.confirm(
                        `¿Borrar «${program.name}» de la biblioteca? Los alumnos conservan sus copias. No se puede deshacer.`,
                      )
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
