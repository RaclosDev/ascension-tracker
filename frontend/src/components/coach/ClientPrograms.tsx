import { confirmAction } from '../../lib/confirmation';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ChevronDown, Library } from 'lucide-react';
import toast from 'react-hot-toast';
import { useClientCustomExercises, formatCoachDate, apiErrorMessage } from '../../lib/coach/api';
import {
  useAssignProgram,
  useClientAssignments,
  useCoachPrograms,
  useCoachProgram,
  useEndAssignment,
  type ProgramAssignment,
} from '../../lib/coach/coachPrograms';
import { useExerciseCatalog, getExerciseMap } from '../../lib/workout/exercises';
import { ProgramSessions } from './ProgramSessions';
import { QueryState } from './ClientSection';
import { ProgramPreview } from './ProgramPreview';
import { Select } from '@/components/ui/select';
import { useAthleteLinks } from './AthleteShell';
import '../../styles/coach-programs.css';

const statusText = (a: ProgramAssignment) =>
  a.status === 'SCHEDULED' ? 'Programado' : a.status === 'ENDED' ? 'Terminado' : 'En curso';

export default function ProgramsSection({
  linkId,
  canAssign,
}: {
  linkId: string;
  canAssign: boolean;
}) {
  const assignments = useClientAssignments(linkId);
  const library = useCoachPrograms();
  const { sectionHref, viewHref } = useAthleteLinks(linkId);
  const assign = useAssignProgram(linkId);
  const end = useEndAssignment(linkId);
  const [params] = useSearchParams();
  const [programId, setProgramId] = useState(() => params.get('programa') ?? '');
  const selected = useCoachProgram(programId || null);
  const ready = library.data?.filter((program) => program.status !== 'DRAFT') ?? [];
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [openAssignment, setOpenAssignment] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const active = assignments.data?.find((a) => a.status === 'ACTIVE');
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const exerciseMap = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
  const exerciseName = (id: string) => exerciseMap.get(id)?.name ?? 'Ejercicio';
  // Weeks published from Planificación reach the athlete as one-week plans with no library origin;
  // they live in Planificación, so this list keeps only the library programs.
  const programs = (assignments.data ?? []).filter(
    (a) => a.sourceProgramId !== null || a.weeks > 1,
  );
  const fromLibrary = programs.filter((a) => showHistory || a.status !== 'ENDED');
  const hasEnded = programs.some((a) => a.status === 'ENDED');

  const row = (a: ProgramAssignment) => {
    // The week of the program that today falls in, for the ones running now.
    const week = Math.min(
      a.weeks,
      Math.floor(differenceInCalendarDays(new Date(), parseISO(a.startDate)) / 7) + 1,
    );
    const open = openAssignment === a.id;
    return (
      <li key={a.id} className="pg-item" data-open={open || undefined}>
        <div className="pg-item-row">
          <div className="pg-item-text">
            <span className="pg-status" data-status={a.status}>
              {statusText(a)}
            </span>
            <strong>{a.programName}</strong>
            <small>
              {`${a.weeks} ${a.weeks === 1 ? 'semana' : 'semanas'} · empieza el ${formatCoachDate(a.startDate)}`}
              {a.status === 'ENDED' && a.endedAt && ` · terminado el ${formatCoachDate(a.endedAt)}`}
            </small>
          </div>
          {a.status === 'ACTIVE' && a.weeks > 1 && (
            <div className="pg-progress">
              <span>
                Semana <b>{week}</b> de {a.weeks}
              </span>
              <span className="pg-bar" aria-hidden="true">
                <span style={{ width: `${(week / a.weeks) * 100}%` }} />
              </span>
            </div>
          )}
          <div className="pg-actions">
            {a.status !== 'ENDED' && canAssign && (
              <Link
                className="btn btn-secondary"
                to={`/entrenador/atletas/${encodeURIComponent(linkId)}/programas/${encodeURIComponent(a.id)}/adaptar`}
              >
                Adaptar
              </Link>
            )}
            <button
              type="button"
              className="btn btn-secondary pg-toggle"
              aria-expanded={open}
              onClick={() => setOpenAssignment(open ? null : a.id)}
            >
              {open ? 'Ocultar sesiones' : 'Sesiones'}
              <ChevronDown size={15} aria-hidden />
            </button>
            {a.status !== 'ENDED' && canAssign && (
              <button
                type="button"
                className="pg-end"
                aria-label={`Terminar ${a.programName}`}
                disabled={end.isPending}
                onClick={async () => {
                  if (
                    !(await confirmAction({
                      title: 'Terminar programa',
                      description: `¿Terminar «${a.programName}»? Tu atleta conserva su copia.`,
                      confirmLabel: 'Terminar programa',
                      destructive: true,
                    }))
                  )
                    return;
                  end.mutate(a.id, {
                    onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo terminar')),
                  });
                }}
              >
                {a.status === 'SCHEDULED' ? 'Cancelar programación' : 'Terminar'}
              </button>
            )}
          </div>
        </div>
        {open && (
          <ProgramSessions linkId={linkId} assignmentId={a.id} exerciseName={exerciseName} />
        )}
      </li>
    );
  };

  const submit = async () => {
    if (!programId || !startDate || !selected.data || selected.data.status === 'DRAFT') return;
    if (
      active &&
      !(await confirmAction({
        title: 'Sustituir programa del atleta',
        description: `«${active.programName}» continuará hasta el ${formatCoachDate(startDate)}. Si ya hay una versión para esa fecha, se sustituirá. Los entrenamientos registrados se conservan. ¿Asignar el nuevo programa?`,
        confirmLabel: 'Asignar programa',
        destructive: false,
      }))
    )
      return;
    assign.mutate(
      { programId, startDate, programUpdatedAt: selected.data.updatedAt },
      {
        onSuccess: () => {
          setProgramId('');
          toast.success('Programa asignado');
        },
        onError: (e) => {
          toast.error(apiErrorMessage(e, 'No se pudo asignar el programa'));
          void selected.refetch();
        },
      },
    );
  };

  const historyToggle = hasEnded && (
    <button
      type="button"
      className="pg-link"
      aria-expanded={showHistory}
      onClick={() => setShowHistory(!showHistory)}
    >
      {showHistory ? 'Ocultar programas anteriores' : 'Ver programas anteriores'}
    </button>
  );
  return (
    <div className="pg">
      <div className="pg-main">
        <section className="card pg-card" aria-labelledby="pg-library-title">
          <header className="pg-head">
            <h2 id="pg-library-title">
              <Library size={16} aria-hidden /> Programas de tu biblioteca
            </h2>
            {historyToggle}
          </header>
          <p className="pg-hint">
            Un programa es la base: cada semana se abre ya rellena en{' '}
            <Link className="pg-link" to={sectionHref('semana')}>
              Planificación
            </Link>
            , donde puedes cambiar solo esa semana y el resto sigue igual. Lo que ha entrenado está
            en{' '}
            <Link className="pg-link" to={viewHref('entrenos')}>
              Entrenos hechos
            </Link>
            .
          </p>
          <QueryState isLoading={assignments.isLoading} isError={assignments.isError} />
          {assignments.data && fromLibrary.length === 0 && (
            <p className="pg-empty">
              {programs.length === 0
                ? 'Aún no le has asignado ningún programa.'
                : 'Ningún programa de tu biblioteca en marcha.'}
            </p>
          )}
          {fromLibrary.length > 0 && <ul className="pg-list">{fromLibrary.map(row)}</ul>}
        </section>
      </div>
      <aside className="card pg-card pg-assign" aria-labelledby="pg-assign-title">
        <header className="pg-head">
          <h2 id="pg-assign-title">Asignar un programa de tu biblioteca</h2>
        </header>
        {!canAssign && (
          <p className="pg-hint">
            Para asignarle programas, tu atleta tiene que darte el permiso «Pautar entrenamiento» en
            sus ajustes.
          </p>
        )}
        {canAssign && library.isError && (
          <p role="alert">
            No se pudo cargar la biblioteca.{' '}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void library.refetch()}
            >
              Reintentar
            </button>
          </p>
        )}
        {canAssign && library.data && ready.length === 0 && (
          <p className="pg-hint">
            Prepara un programa y márcalo como listo en tu{' '}
            <Link to="/entrenador/planificacion?pestana=programas">biblioteca</Link> para asignarlo.
          </p>
        )}
        {canAssign && ready.length > 0 && (
          <div className="pg-form">
            <label>
              Programa
              <Select
                className="form-input min-h-11"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
              >
                <option value="">Elige un programa</option>
                {ready.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Empieza el
              <input
                type="date"
                className="form-input min-h-11"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !programId ||
                !startDate ||
                assign.isPending ||
                !selected.data ||
                selected.data.status === 'DRAFT' ||
                selected.isFetching ||
                assignments.isError ||
                assignments.isPending
              }
              onClick={submit}
            >
              Asignar
            </button>
            {programId && selected.isLoading && <p role="status">Cargando vista previa…</p>}
            {programId && selected.isError && (
              <p role="alert">
                No se pudo cargar la vista previa.{' '}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void selected.refetch()}
                >
                  Reintentar
                </button>
              </p>
            )}
            {selected.data && (
              <>
                <p className="pg-hint">
                  Se publicará una copia de este programa solo para este atleta, con inicio el{' '}
                  {formatCoachDate(startDate)}.{' '}
                  {active && 'El programa actual continúa hasta esa fecha.'} Los registros
                  anteriores se conservan. La vista previa está debajo.
                </p>
                {selected.data.status === 'DRAFT' && (
                  <p role="alert">
                    Este programa ha vuelto a borrador. Márcalo como listo antes de asignarlo.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </aside>
      {canAssign && selected.data && (
        <div className="pg-preview">
          <ProgramPreview program={selected.data} />
        </div>
      )}
    </div>
  );
}
