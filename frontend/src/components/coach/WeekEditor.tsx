import { useState } from 'react';
import toast from 'react-hot-toast';
import { addDays, format, parseISO } from 'date-fns';
import { useSessionDraft } from '@/hooks/useSessionDraft';
import { apiErrorMessage, formatCoachDate } from '@/lib/coach/api';
import { confirmAction } from '@/lib/confirmation';
import {
  addDay,
  copyDay,
  findDay,
  publishProblems,
  removeDay,
  updateDay,
  useAssignedProgram,
  useSaveProgram,
  WEEKDAY_LABELS,
  type ProgramAssignment,
  type ProgramDay,
} from '@/lib/coach/coachPrograms';
import {
  INTENTS,
  isSavedWeek,
  shiftWeek,
  usePublishWeek,
  useSaveWeek,
  weekFrom,
  type SavedWeek,
  type WeekContent,
} from '@/lib/coach/weeks';
import { DayEditor } from './editor/DayEditor';
import { LibraryInsert } from './editor/LibraryInsert';
import { ProgramPreview } from './ProgramPreview';
import { downloadWeekBackup } from '@/lib/coach/weekBackup';
import { BulkPrescription } from './editor/BulkPrescription';

export function WeekEditor({
  saved,
  source,
  canEdit,
  reload,
}: {
  saved: SavedWeek;
  source?: ProgramAssignment;
  canEdit: boolean;
  reload: () => Promise<unknown>;
}) {
  const draft = useSessionDraft(
    `coach-week:${saved.linkId}:${saved.weekStart}`,
    saved,
    isSavedWeek,
  );
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const save = useSaveWeek(saved.linkId, saved.weekStart);
  const publish = usePublishWeek(saved.linkId, saved.weekStart);
  const library = useSaveProgram();
  const previous = useAssignedProgram(saved.linkId, source?.id ?? '');
  const value = draft.value;
  const program = value.content.program;
  const pending = save.isPending || publish.isPending;
  const stale = value.version !== saved.version || conflict;
  const published = saved.publishedVersion === saved.version && saved.version > 0;
  const edit = (content: WeekContent) => {
    draft.setValue({ ...value, content });
    setError(null);
  };
  const editProgram = (next: typeof program) => edit({ ...value.content, program: next });
  const persist = async () => {
    const result = await save.mutateAsync(value);
    draft.clear();
    return result;
  };
  const fail = (cause: unknown) => {
    setError(apiErrorMessage(cause, 'No se pudo guardar. Conservamos tus cambios.'));
    if (cause && typeof cause === 'object' && 'response' in cause) {
      const response = cause.response as { status?: number };
      if (response?.status === 409) {
        setConflict(true);
        void reload();
      }
    }
  };
  const insert = async (days: ProgramDay[]) => {
    if (
      days.some((d) => findDay(program, 1, d.dayIndex)) &&
      !(await confirmAction({
        title: 'Sustituir sesiones',
        description:
          'Se sustituirán solo los días que coinciden con la selección. Los demás días se conservan.',
        confirmLabel: 'Sustituir días',
        destructive: true,
      }))
    )
      return;
    editProgram({
      ...program,
      days: [
        ...program.days.filter((d) => !days.some((n) => n.dayIndex === d.dayIndex)),
        ...days,
      ].sort((a, b) => a.dayIndex - b.dayIndex),
    });
  };
  return (
    <section className="min-w-0 flex flex-col gap-3" aria-label="Preparar semana">
      <header className="card">
        <h2>Preparación · {formatCoachDate(saved.weekStart)}</h2>
        <p>
          Hasta el {formatCoachDate(format(addDays(parseISO(saved.weekStart), 6), 'yyyy-MM-dd'))}
        </p>
        <p role="status">
          {draft.dirty
            ? 'Cambios locales pendientes de guardar'
            : published
              ? 'Semana publicada'
              : saved.version > 0
                ? 'Borrador guardado'
                : 'Semana sin preparar'}
        </p>
        {source && (
          <p className="text-sm">
            Origen para copiar: {source.programName}. Solo se copian los días vigentes de esa
            semana.
          </p>
        )}
        {value.content.decision && (
          <p>
            {published && !draft.dirty
              ? 'Decisión aplicada en la publicación'
              : 'Decisión pendiente de publicar'}
            : {value.content.decision}
          </p>
        )}
      </header>
      {error && <p role="alert">{error}</p>}
      {stale && (
        <div className="card" role="alert">
          <p>
            Esta semana cambió en otra sesión. Conservamos tu borrador local. Compara con la versión
            guardada antes de continuar.
          </p>
          <details>
            <summary>Ver versión guardada</summary>
            <ProgramPreview program={saved.content.program} />
            <p>Notas privadas: {saved.content.privateNotes || 'Sin notas'}</p>
            <p>Decisión: {saved.content.decision || 'Sin decisión'}</p>
          </details>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => downloadWeekBackup(value, saved)}
          >
            Descargar ambas versiones completas (JSON)
          </button>
          <p className="text-sm">
            La copia incluye las pautas, las notas privadas y la decisión de ambas versiones.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={library.isPending}
            onClick={() =>
              library.mutate(
                {
                  ...program,
                  id: null,
                  updatedAt: null,
                  name: `${program.name.slice(0, 100)} (recuperado)`,
                  status: 'DRAFT',
                },
                {
                  onSuccess: () =>
                    toast.success('Tu programación se ha guardado como otra plantilla'),
                  onError: fail,
                },
              )
            }
          >
            Conservar mi programación como plantilla
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              if (
                await confirmAction({
                  title: 'Cargar versión guardada',
                  description:
                    'Se descartarán los cambios locales de esta semana, incluidas las notas privadas. Conserva antes cualquier información que necesites.',
                  confirmLabel: 'Cargar versión',
                  destructive: true,
                })
              ) {
                draft.clear();
                setConflict(false);
              }
            }}
          >
            Cargar versión guardada
          </button>
        </div>
      )}
      <fieldset disabled={pending || !canEdit || stale} className="min-w-0 flex flex-col gap-3">
        <div className="card flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!previous.data || previous.isFetching}
            onClick={async () => {
              if (!previous.data || !source) return;
              const copied = weekFrom(previous.data, source, shiftWeek(saved.weekStart, -1));
              if (!copied.days.length) {
                setError('El programa anterior no contiene sesiones para esa semana.');
                return;
              }
              if (
                program.days.length &&
                !(await confirmAction({
                  title: 'Copiar semana anterior',
                  description:
                    'Se sustituirán los días y notas públicas del borrador por la semana anterior. Las notas privadas y la decisión se conservan.',
                  confirmLabel: 'Copiar semana',
                  destructive: true,
                }))
              )
                return;
              editProgram({ ...copied, name: program.name });
            }}
          >
            Copiar semana anterior
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              if (
                !program.days.length ||
                (await confirmAction({
                  title: 'Empezar de cero',
                  description:
                    'Se quitarán los días del borrador. Los registros del alumno se conservan.',
                  confirmLabel: 'Vaciar días',
                  destructive: true,
                }))
              )
                editProgram({ ...program, days: [] });
            }}
          >
            Empezar de cero
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'Editar' : 'Vista del alumno'}
          </button>
          {previous.isError && (
            <p role="alert">
              No se pudo cargar la semana anterior.{' '}
              <button type="button" onClick={() => void previous.refetch()}>
                Reintentar
              </button>
            </p>
          )}
        </div>
        <div className="card grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 min-w-0">
            Nombre
            <input
              className="form-input min-h-11"
              maxLength={120}
              value={program.name}
              onChange={(e) => editProgram({ ...program, name: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 min-w-0">
            Objetivo de la semana
            <select
              className="form-input min-h-11"
              value={value.content.intent}
              onChange={(e) =>
                edit({ ...value.content, intent: e.target.value as WeekContent['intent'] })
              }
            >
              {Object.entries(INTENTS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1 min-w-0">
            Comentario para el alumno
            <textarea
              className="form-input min-h-11"
              maxLength={2000}
              rows={2}
              value={program.notes ?? ''}
              onChange={(e) => editProgram({ ...program, notes: e.target.value || null })}
              placeholder="Por ejemplo: semana de descarga; prioriza técnica y recuperación."
            />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1 min-w-0">
            Decisión que aplicar al publicar
            <textarea
              className="form-input min-h-11"
              maxLength={2000}
              rows={2}
              value={value.content.decision}
              onChange={(e) => edit({ ...value.content, decision: e.target.value })}
            />
          </label>
          <details className="sm:col-span-2">
            <summary className="cursor-pointer">Notas privadas del entrenador</summary>
            <textarea
              aria-label="Notas privadas del entrenador"
              className="w-full mt-2 form-input min-h-11"
              rows={3}
              maxLength={4000}
              value={value.content.privateNotes}
              onChange={(e) => edit({ ...value.content, privateNotes: e.target.value })}
            />
            <p className="text-sm">
              Solo tú puedes ver estas notas. No forman parte de la pauta del alumno.
            </p>
          </details>
        </div>
        {preview ? (
          <ProgramPreview program={program} />
        ) : (
          <>
            <LibraryInsert onInsert={(days) => void insert(days)} />
            <BulkPrescription program={program} onChange={editProgram} />
            {WEEKDAY_LABELS.map((label, i) => {
              const dayIndex = i + 1;
              const day = findDay(program, 1, dayIndex);
              return day ? (
                <DayEditor
                  key={dayIndex}
                  label={`${label} ${format(addDays(parseISO(saved.weekStart), i), 'dd/MM')}`}
                  day={day}
                  weeks={1}
                  onChange={(change) => editProgram(updateDay(program, 1, dayIndex, change))}
                  onRemove={async () => {
                    if (
                      await confirmAction({
                        title: 'Quitar sesión',
                        description: `¿Quitar «${day.name}» del borrador?`,
                        confirmLabel: 'Quitar sesión',
                        destructive: true,
                      })
                    )
                      editProgram(removeDay(program, 1, dayIndex));
                  }}
                  onCopy={async (to) => {
                    if (
                      !findDay(program, 1, to.dayIndex) ||
                      (await confirmAction({
                        title: 'Sustituir sesión',
                        description: 'El día de destino se sustituirá por esta sesión.',
                        confirmLabel: 'Copiar sesión',
                        destructive: true,
                      }))
                    )
                      editProgram(copyDay(program, { week: 1, dayIndex }, to));
                  }}
                />
              ) : (
                <div key={dayIndex} className="card flex justify-between gap-2 items-center">
                  <span>{label} · descanso</span>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => editProgram(addDay(program, 1, dayIndex))}
                  >
                    Añadir sesión
                  </button>
                </div>
              );
            })}
          </>
        )}
      </fieldset>
      {canEdit && (
        <footer
          className="card sticky bottom-3 z-10 flex flex-wrap gap-2"
          style={{ background: 'var(--bg-card)' }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending || stale || !draft.dirty}
            onClick={() =>
              void persist()
                .then(() => toast.success('Borrador guardado'))
                .catch(fail)
            }
          >
            Guardar borrador
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || stale || (published && !draft.dirty)}
            onClick={async () => {
              const problems = publishProblems(program);
              if (problems.length) {
                setError(problems[0]);
                return;
              }
              const sessions = program.days.length;
              const sets = program.days.flatMap((d) => d.exercises).reduce((n, e) => n + e.sets, 0);
              const start =
                saved.weekStart > format(new Date(), 'yyyy-MM-dd')
                  ? saved.weekStart
                  : format(new Date(), 'yyyy-MM-dd');
              if (
                !(await confirmAction({
                  title: 'Publicar semana',
                  description: `${sessions} sesiones y ${sets} series en la semana, con vigencia desde el ${formatCoachDate(start)}. El alumno verá las notas públicas. Su plan actual continúa hasta el inicio; se sustituirá cualquier plan previsto para esa fecha. Los días transcurridos no se asignan como pendientes.`,
                  confirmLabel: 'Publicar semana',
                }))
              )
                return;
              try {
                const current = draft.dirty || !saved.version ? await persist() : saved;
                await publish.mutateAsync(current.version);
                toast.success('Semana publicada');
              } catch (cause) {
                fail(cause);
              }
            }}
          >
            {pending ? 'Guardando…' : 'Publicar semana'}
          </button>
        </footer>
      )}
    </section>
  );
}
