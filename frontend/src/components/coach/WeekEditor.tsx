import { useMemo, useState, type DragEvent } from 'react';
import toast from 'react-hot-toast';
import { Copy, Eye, Pencil, Plus } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { useSessionDraft } from '@/hooks/useSessionDraft';
import { apiErrorMessage, formatCoachDate } from '@/lib/coach/api';
import { confirmAction } from '@/lib/confirmation';
import {
  addDay,
  copyDay,
  findDay,
  MAX_EXERCISES_PER_DAY,
  newExercise,
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
import { ExerciseSearch } from './editor/ExerciseSearch';
import { LastWeek } from './editor/LastWeek';
import { LibraryInsert } from './editor/LibraryInsert';
import { ProgramPreview } from './ProgramPreview';
import { downloadWeekBackup } from '@/lib/coach/weekBackup';
import { BulkPrescription } from './editor/BulkPrescription';
import { Select } from '@/components/ui/select';

const DRAG_TYPE = 'application/x-ascension-week-item';
const PANELS = [
  { id: 'exercises', label: 'Ejercicios' },
  { id: 'previous', label: 'Semana pasada' },
  { id: 'library', label: 'Plantillas' },
  { id: 'notes', label: 'Notas' },
] as const;
type Panel = (typeof PANELS)[number]['id'];

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
  const [panel, setPanel] = useState<Panel>(
    source && !draft.value.content.program.days.length ? 'previous' : 'exercises',
  );
  const [targetDay, setTargetDay] = useState(
    () => draft.value.content.program.days[0]?.dayIndex ?? 1,
  );
  const [dropDay, setDropDay] = useState<number | null>(null);
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
  const locked = pending || !canEdit || stale;
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
  const lastWeek = useMemo(
    () =>
      previous.data && source
        ? weekFrom(previous.data, source, shiftWeek(saved.weekStart, -1))
        : null,
    [previous.data, source, saved.weekStart],
  );
  const dayName = (dayIndex: number) => WEEKDAY_LABELS[dayIndex - 1].toLocaleLowerCase('es');
  const addExercise = (dayIndex: number, exercise: { id: string; name: string }) => {
    const base = addDay(program, 1, dayIndex);
    if ((findDay(base, 1, dayIndex)?.exercises.length ?? 0) >= MAX_EXERCISES_PER_DAY) {
      setError(`El ${dayName(dayIndex)} ya tiene el máximo de ejercicios.`);
      return;
    }
    editProgram(
      updateDay(base, 1, dayIndex, (day) => ({
        ...day,
        exercises: [...day.exercises, newExercise(exercise.id, exercise.name)],
      })),
    );
    setTargetDay(dayIndex);
    toast.success(`${exercise.name}: añadido al ${dayName(dayIndex)}`);
  };
  const copyLastDay = (dayIndex: number, to: number) => {
    const day = lastWeek?.days.find((d) => d.dayIndex === dayIndex);
    if (!day) return;
    setTargetDay(to);
    void insert([{ ...structuredClone(day), week: 1, dayIndex: to }]);
  };
  // Days accept exercises and last week's sessions dragged from the side panel.
  const dropTarget = (dayIndex: number) => ({
    'data-drop': dropDay === dayIndex ? '' : undefined,
    onDragOver: (e: DragEvent) => {
      if (locked || !e.dataTransfer.types.includes(DRAG_TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDropDay(dayIndex);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null))
        setDropDay((current) => (current === dayIndex ? null : current));
    },
    onDrop: (e: DragEvent) => {
      const data = e.dataTransfer.getData(DRAG_TYPE);
      setDropDay(null);
      if (locked || !data) return;
      e.preventDefault();
      const item = JSON.parse(data) as
        { kind: 'exercise'; id: string; name: string } | { kind: 'day'; dayIndex: number };
      if (item.kind === 'exercise') addExercise(dayIndex, item);
      else copyLastDay(item.dayIndex, dayIndex);
    },
  });
  const sets = program.days.flatMap((day) => day.exercises).reduce((n, e) => n + e.sets, 0);
  const selected = findDay(program, 1, targetDay);
  const selectedLabel = WEEKDAY_LABELS[targetDay - 1];
  const dateOf = (dayIndex: number, pattern: string) =>
    format(addDays(parseISO(saved.weekStart), dayIndex - 1), pattern);
  const lastSameDay = lastWeek?.days.find((d) => d.dayIndex === targetDay);
  const showExercises = () => {
    setPanel('exercises');
    window.setTimeout(() =>
      document.querySelector<HTMLInputElement>('.week-panel input[type="search"]')?.focus(),
    );
  };
  return (
    <section className="week-editor min-w-0" aria-label="Preparar semana">
      <header className="week-bar">
        <div className="week-bar-info">
          <h2>
            Preparación · {formatCoachDate(saved.weekStart)} –{' '}
            {formatCoachDate(format(addDays(parseISO(saved.weekStart), 6), 'yyyy-MM-dd'))}
          </h2>
          <div className="week-bar-meta">
            <p role="status" data-dirty={draft.dirty ? '' : undefined}>
              {draft.dirty
                ? 'Cambios locales pendientes de guardar'
                : published
                  ? 'Semana publicada'
                  : saved.version > 0
                    ? 'Borrador guardado'
                    : 'Semana sin preparar'}
            </p>
            <p className="coach-week-counts">
              {program.days.length} {program.days.length === 1 ? 'sesión' : 'sesiones'} · {sets}{' '}
              series · {INTENTS[value.content.intent]}
            </p>
          </div>
        </div>
        <div className="week-bar-actions">
          <button
            type="button"
            className="btn btn-secondary"
            data-tour="copy-week"
            disabled={locked || !previous.data || previous.isFetching}
            onClick={async () => {
              if (!lastWeek) return;
              if (!lastWeek.days.length) {
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
              editProgram({ ...structuredClone(lastWeek), name: program.name });
              setTargetDay(lastWeek.days[0].dayIndex);
            }}
          >
            <Copy size={15} aria-hidden /> Copiar semana anterior
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={locked}
            data-tour="student-preview"
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
          >
            {preview ? <Pencil size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
            {preview ? 'Editar' : 'Vista del atleta'}
          </button>
          {canEdit && (
            <span className="week-bar-publish" data-tour="week-publish">
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
                  const sets = program.days
                    .flatMap((d) => d.exercises)
                    .reduce((n, e) => n + e.sets, 0);
                  const start =
                    saved.weekStart > format(new Date(), 'yyyy-MM-dd')
                      ? saved.weekStart
                      : format(new Date(), 'yyyy-MM-dd');
                  if (
                    !(await confirmAction({
                      title: 'Publicar semana',
                      description: `${sessions} sesiones y ${sets} series en la semana, con vigencia desde el ${formatCoachDate(start)}. El atleta verá las notas públicas. Su plan actual continúa hasta el inicio; se sustituirá cualquier plan previsto para esa fecha. Los días transcurridos no se asignan como pendientes.`,
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
            </span>
          )}
        </div>
      </header>
      {value.content.decision && (
        <p className="week-decision">
          {published && !draft.dirty
            ? 'Decisión aplicada en la publicación'
            : 'Decisión pendiente de publicar'}
          : {value.content.decision}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {previous.isError && (
        <p role="alert">
          No se pudo cargar la semana anterior.{' '}
          <button type="button" onClick={() => void previous.refetch()}>
            Reintentar
          </button>
        </p>
      )}
      {stale && (
        <div className="week-conflict" role="alert">
          <div className="week-conflict-main">
            <p>
              Esta semana cambió en otra sesión. Conservamos tu borrador local. Compara con la
              versión guardada antes de continuar.
            </p>
            <button
              type="button"
              className="btn btn-primary"
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
          <details>
            <summary>Comparar o conservar mi borrador antes</summary>
            <div className="week-conflict-more">
              <ProgramPreview program={saved.content.program} />
              <p>Notas privadas: {saved.content.privateNotes || 'Sin notas'}</p>
              <p>Decisión: {saved.content.decision || 'Sin decisión'}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => downloadWeekBackup(value, saved)}
                >
                  Descargar ambas versiones completas (JSON)
                </button>
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
              </div>
              <p className="text-sm">
                La copia incluye las pautas, las notas privadas y la decisión de ambas versiones.
              </p>
            </div>
          </details>
        </div>
      )}
      {preview && <ProgramPreview program={program} />}
      <div className="week-body" hidden={preview}>
        <nav className="week-board" aria-label="Días de la semana">
          {WEEKDAY_LABELS.map((label, i) => {
            const day = findDay(program, 1, i + 1);
            return (
              <button
                key={label}
                type="button"
                className="week-day"
                data-rest={day ? undefined : ''}
                aria-pressed={targetDay === i + 1}
                {...dropTarget(i + 1)}
                onClick={() => setTargetDay(i + 1)}
              >
                <span className="week-day-date">
                  {label.slice(0, 3)} {dateOf(i + 1, 'd')}
                </span>
                <strong>{day ? day.name || 'Sin nombre' : 'Descanso'}</strong>
                {day && (
                  <>
                    <small>
                      {day.exercises.length}{' '}
                      {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} ·{' '}
                      {day.exercises.reduce((n, e) => n + e.sets, 0)} series
                    </small>
                    <ol>
                      {day.exercises.map((exercise, j) => (
                        <li key={j}>
                          <span>{exercise.exerciseName ?? exercise.exerciseId}</span>
                          <em>
                            {exercise.sets}×
                            {exercise.repsMax && exercise.repsMax !== exercise.repsMin
                              ? `${exercise.repsMin ?? ''}–${exercise.repsMax}`
                              : (exercise.repsMin ?? '–')}
                          </em>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </button>
            );
          })}
        </nav>
        <div className="week-work">
          <fieldset disabled={locked} className="week-work-day min-w-0" {...dropTarget(targetDay)}>
            {selected ? (
              <DayEditor
                key={targetDay}
                flat
                compact
                label={`${selectedLabel} ${dateOf(targetDay, 'dd/MM')}`}
                day={selected}
                weeks={1}
                onAddExercise={showExercises}
                onChange={(change) => editProgram(updateDay(program, 1, targetDay, change))}
                onRemove={async () => {
                  if (
                    await confirmAction({
                      title: 'Quitar sesión',
                      description: `¿Quitar «${selected.name}» del borrador?`,
                      confirmLabel: 'Quitar sesión',
                      destructive: true,
                    })
                  )
                    editProgram(removeDay(program, 1, targetDay));
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
                    editProgram(copyDay(program, { week: 1, dayIndex: targetDay }, to));
                }}
              />
            ) : (
              <div className="week-rest">
                <h3>
                  {selectedLabel} {dateOf(targetDay, 'd')} · descanso
                </h3>
                <p>No hay sesión este día. El atleta lo verá como descanso.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-primary"
                    type="button"
                    aria-label={`Añadir sesión el ${dayName(targetDay)}`}
                    onClick={() => {
                      editProgram(addDay(program, 1, targetDay));
                      showExercises();
                    }}
                  >
                    <Plus size={16} aria-hidden /> Añadir sesión
                  </button>
                  {lastSameDay && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => copyLastDay(targetDay, targetDay)}
                    >
                      <Copy size={15} aria-hidden /> Repetir «{lastSameDay.name || 'la sesión'}» de
                      la semana pasada
                    </button>
                  )}
                </div>
              </div>
            )}
          </fieldset>
          <fieldset disabled={locked} className="min-w-0">
            <div className="card week-panel">
              <div className="week-panel-tabs" role="group" aria-label="Herramientas de la semana">
                {PANELS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    data-week-panel={option.id}
                    aria-pressed={panel === option.id}
                    onClick={() => setPanel(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div hidden={panel !== 'exercises'} className="week-panel-body">
                <p className="week-panel-hint">
                  Se añaden al <strong>{dayName(targetDay)}</strong>. También puedes arrastrarlos a
                  otro día.
                </p>
                <ExerciseSearch
                  limit={10}
                  dragType={DRAG_TYPE}
                  onPick={(exercise) => addExercise(targetDay, exercise)}
                />
              </div>
              <div hidden={panel !== 'previous'} className="week-panel-body">
                {lastWeek?.days.length ? (
                  <>
                    <p className="week-panel-hint">
                      {source?.programName}. Copia una sesión a su mismo día o arrástrala a otro.
                    </p>
                    <LastWeek
                      week={lastWeek}
                      dragType={DRAG_TYPE}
                      disabled={locked}
                      onCopy={(day) => copyLastDay(day.dayIndex, day.dayIndex)}
                    />
                  </>
                ) : source && previous.isPending ? (
                  <p role="status">Cargando la semana anterior…</p>
                ) : (
                  <p className="week-panel-hint">
                    No hay sesiones publicadas la semana anterior. Parte de una plantilla o añade
                    ejercicios a cada día.
                  </p>
                )}
              </div>
              <div hidden={panel !== 'library'} className="week-panel-body">
                <LibraryInsert onInsert={(days) => void insert(days)} />
              </div>
              <div hidden={panel !== 'notes'} className="week-panel-body">
                <div className="grid gap-4">
                  <label className="flex flex-col gap-1 min-w-0">
                    Nombre
                    <input
                      className="form-input min-h-11"
                      maxLength={120}
                      value={program.name}
                      onChange={(e) => editProgram({ ...program, name: e.target.value })}
                    />
                  </label>
                  <label data-tour="week-intent" className="flex flex-col gap-1 min-w-0">
                    Objetivo de la semana
                    <Select
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
                    </Select>
                  </label>
                  <label data-tour="week-comment" className="flex flex-col gap-1 min-w-0">
                    Comentario para el atleta
                    <textarea
                      className="form-input min-h-11"
                      maxLength={2000}
                      rows={2}
                      value={program.notes ?? ''}
                      onChange={(e) => editProgram({ ...program, notes: e.target.value || null })}
                      placeholder="Por ejemplo: semana de descarga; prioriza técnica y recuperación."
                    />
                  </label>
                  <label className="flex flex-col gap-1 min-w-0">
                    Decisión que aplicar al publicar
                    <textarea
                      className="form-input min-h-11"
                      maxLength={2000}
                      rows={2}
                      value={value.content.decision}
                      onChange={(e) => edit({ ...value.content, decision: e.target.value })}
                    />
                  </label>
                  <details data-tour="week-private">
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
                      Solo tú puedes ver estas notas. No forman parte de la pauta del atleta.
                    </p>
                  </details>
                </div>
                <BulkPrescription program={program} onChange={editProgram} />
                {program.days.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary week-reset"
                    disabled={locked}
                    onClick={async () => {
                      if (
                        await confirmAction({
                          title: 'Empezar de cero',
                          description:
                            'Se quitarán los días del borrador. Los registros del atleta se conservan.',
                          confirmLabel: 'Vaciar días',
                          destructive: true,
                        })
                      )
                        editProgram({ ...program, days: [] });
                    }}
                  >
                    Empezar de cero
                  </button>
                )}
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </section>
  );
}
