import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { useClientCustomExercises, formatCoachDate, apiErrorMessage } from '../../lib/coach/api';
import {
  useAssignProgram,
  useClientAssignments,
  useCoachPrograms,
  useCoachProgram,
  useEndAssignment,
} from '../../lib/coach/coachPrograms';
import { useExerciseCatalog, getExerciseMap } from '../../lib/workout/exercises';
import { ProgramSessions } from './ProgramSessions';
import { Section, QueryState } from './ClientSection';
import { ProgramPreview } from './ProgramPreview';

export default function ProgramsSection({
  linkId,
  canAssign,
}: {
  linkId: string;
  canAssign: boolean;
}) {
  const assignments = useClientAssignments(linkId);
  const library = useCoachPrograms();
  const assign = useAssignProgram(linkId);
  const end = useEndAssignment(linkId);
  const [programId, setProgramId] = useState('');
  const selected = useCoachProgram(programId || null);
  const ready = library.data?.filter((program) => program.status !== 'DRAFT') ?? [];
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [openAssignment, setOpenAssignment] = useState<string | null>(null);
  const active = assignments.data?.find((a) => a.status === 'ACTIVE');
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const exerciseMap = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
  const exerciseName = (id: string) => exerciseMap.get(id)?.name ?? 'Ejercicio';

  const submit = () => {
    if (!programId || !startDate || !selected.data || selected.data.status === 'DRAFT') return;
    if (
      active &&
      !window.confirm(
        `Esto termina ahora «${active.programName}», aunque el nuevo programa empiece más adelante. Los entrenamientos registrados se conservan. ¿Asignar el nuevo programa?`,
      )
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

  return (
    <Section title="Programa" icon={<ClipboardList size={18} aria-hidden />}>
      <QueryState isLoading={assignments.isLoading} isError={assignments.isError} />
      {assignments.data?.length === 0 && (
        <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
          Aún no le has asignado ningún programa.
        </p>
      )}
      {assignments.data && assignments.data.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {assignments.data.map((a) => (
            <li key={a.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-foreground truncate">{a.programName}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {a.weeks} {a.weeks === 1 ? 'semana' : 'semanas'} · empieza el{' '}
                    {formatCoachDate(a.startDate)}
                    {a.status === 'ENDED' &&
                      a.endedAt &&
                      ` · terminado el ${formatCoachDate(a.endedAt)}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    aria-expanded={openAssignment === a.id}
                    onClick={() => setOpenAssignment(openAssignment === a.id ? null : a.id)}
                  >
                    {openAssignment === a.id ? 'Ocultar sesiones' : 'Sesiones'}
                  </button>
                  {a.status === 'ACTIVE' && canAssign && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-label={`Terminar ${a.programName}`}
                      disabled={end.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `¿Terminar «${a.programName}»? Tu alumno conserva su copia.`,
                          )
                        )
                          return;
                        end.mutate(a.id, {
                          onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo terminar')),
                        });
                      }}
                    >
                      Terminar
                    </button>
                  )}
                </div>
              </div>
              {openAssignment === a.id && (
                <ProgramSessions linkId={linkId} assignmentId={a.id} exerciseName={exerciseName} />
              )}
            </li>
          ))}
        </ul>
      )}
      {!canAssign && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Para asignarle programas, tu alumno tiene que darte el permiso «Pautar entrenamiento» en
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
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Prepara un programa y márcalo como listo en tu{' '}
          <Link to="/entrenador/programas">biblioteca</Link> para asignarlo.
        </p>
      )}
      {canAssign && ready.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Programa
              <select value={programId} onChange={(e) => setProgramId(e.target.value)}>
                <option value="">Elige un programa</option>
                {ready.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Empieza el
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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
          </div>
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
              <p className="text-sm">
                Se publicará una copia de este programa solo para este alumno, con inicio el{' '}
                {formatCoachDate(startDate)}. {active && 'La asignación actual terminará ahora.'}{' '}
                Los registros anteriores se conservan.
              </p>
              {selected.data.status === 'DRAFT' && (
                <p role="alert">
                  Este programa ha vuelto a borrador. Márcalo como listo antes de asignarlo.
                </p>
              )}
              <ProgramPreview program={selected.data} />
            </>
          )}
        </div>
      )}
    </Section>
  );
}
