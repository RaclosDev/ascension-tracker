import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage, formatCoachDate } from '../lib/coach/api';
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

  return (
    <div className="fade-in max-w-5xl mx-auto px-4 pt-2 sm:pt-4">
      <header className="mb-6 pb-2 border-b border-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/entrenador/planificacion"
            aria-label="Volver a planificación"
            className="btn btn-secondary"
          >
            <ArrowLeft size={16} aria-hidden />
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight truncate">Programas</h1>
        </div>
        <Link to="/entrenador/programas/nuevo" className="btn btn-primary">
          <Plus size={16} aria-hidden /> Nuevo programa
        </Link>
      </header>

      {programs.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {programs.isError && (
        <p role="alert">
          {apiErrorMessage(programs.error, 'No se pudieron cargar tus programas.')}
        </p>
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
          {programs.data.map((program) => (
            <li key={program.id} className="card flex items-center justify-between gap-3">
              <Link to={`/entrenador/programas/${program.id}`} className="min-w-0 flex-1">
                <div className="font-bold text-white truncate">{program.name}</div>
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
                    if (!window.confirm(`¿Borrar «${program.name}»? No se puede deshacer.`)) return;
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
    </div>
  );
}
