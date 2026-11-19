import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Maximize2,
  Pencil,
  X,
} from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { useSessionDraft } from '@/hooks/useSessionDraft';
import {
  apiErrorMessage,
  formatCoachDate,
  personName,
  useClientData,
  type CoachClient,
} from '@/lib/coach/api';
import { exerciseUse } from '@/lib/coach/exerciseHistory';
import type { CompletedWorkout } from '@/lib/workout/types';
import { useAthleteCalendar } from '@/lib/coach/calendar';
import { confirmAction } from '@/lib/confirmation';
import {
  addDay,
  findDay,
  MAX_EXERCISES_PER_DAY,
  newExercise,
  publishProblems,
  removeDay,
  updateDay,
  useAssignedProgram,
  useSaveProgram,
  WEEKDAY_LABELS,
  type Program,
  type ProgramAssignment,
  type ProgramDay,
  type ProgramExercise,
} from '@/lib/coach/coachPrograms';
import {
  INTENTS,
  isSavedWeek,
  shiftWeek,
  usePublishWeek,
  useSaveWeek,
  weekDate,
  weekFrom,
  type SavedWeek,
  type WeekContent,
} from '@/lib/coach/weeks';
import { fetchDone, withDone } from '@/lib/coach/doneWeek';
import { sendDay, sendExercise, weekText } from '@/lib/coach/weekBoard';
import { downloadWeekBackup } from '@/lib/coach/weekBackup';
import { isCoachTourFrame } from './tour/frame';
import { BulkPrescription } from './editor/BulkPrescription';
import { LastWeek } from './editor/LastWeek';
import { LibraryInsert } from './editor/LibraryInsert';
import { WeekVolume } from './editor/WeekVolume';
import { AthleteCalendar, longDate } from './calendar/AthleteCalendar';
import { DayFacts } from './calendar/DayFacts';
import { DaySession } from './calendar/DaySession';
import { ExercisePanel } from './calendar/ExercisePanel';
import { WeekStrip } from './calendar/WeekStrip';
import { AthleteHistory } from './editor/prescribing';
import { ProgramPreview } from './ProgramPreview';

const DRAG_TYPE = 'application/x-ascension-week-item';
const AUTOSAVE_MS = 1500;
/** How far back the athlete's sessions are read to know what they train and what they last did. */
const HISTORY_WEEKS = 12;
const PANELS = [
  { id: 'previous', label: 'Plan anterior' },
  { id: 'library', label: 'Biblioteca' },
  { id: 'notes', label: 'Ajustes de la semana' },
] as const;
type Panel = (typeof PANELS)[number]['id'];

export function WeekEditor({
  saved,
  source,
  canEdit,
  reload,
  lead,
  link,
  from,
  day,
  onSelect,
  wide,
  onWide,
}: {
  saved: SavedWeek;
  source?: ProgramAssignment;
  canEdit: boolean;
  reload: () => Promise<unknown>;
  /** The week picker: it shares the bar with the saving state and the publish button. */
  lead?: ReactNode;
  link: CoachClient;
  /** First week of the calendar around the one being edited. */
  from: string;
  /** Day of this week open beside the calendar. */
  day: number | null;
  onSelect: (week: string, day: number | null) => void;
  /** The open day takes the screen: the calendar folds to its week and the exercises sit beside. */
  wide: boolean;
  onWide: (wide: boolean) => void;
}) {
  const draft = useSessionDraft(
    `coach-week:${saved.linkId}:${saved.weekStart}`,
    saved,
    isSavedWeek,
  );
  const [preview, setPreview] = useState(false);
  // The week this one was repeating when it was opened, to say so when saving breaks the tie.
  const [followed, setFollowed] = useState({ week: saved.weekStart, from: saved.linkedFrom });
  if (followed.week !== saved.weekStart || (saved.linkedFrom && saved.linkedFrom !== followed.from))
    setFollowed({ week: saved.weekStart, from: saved.linkedFrom });
  const [panel, setPanel] = useState<Panel | null>(
    source && !draft.value.content.program.days.length ? 'previous' : null,
  );
  const [dropDay, setDropDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyingDone, setCopyingDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const save = useSaveWeek(saved.linkId, saved.weekStart);
  const publish = usePublishWeek(saved.linkId, saved.weekStart);
  const library = useSaveProgram();
  const previous = useAssignedProgram(saved.linkId, source?.id ?? '');
  const value = draft.value;
  const program = value.content.program;
  // A save that reached the server but whose answer was lost (a reload in between) is not a conflict.
  const adopted = useMemo(
    () =>
      draft.dirty &&
      value.version !== saved.version &&
      JSON.stringify(value.content) === JSON.stringify(saved.content),
    [draft.dirty, value, saved],
  );
  const stale = conflict || (!saving && !adopted && value.version !== saved.version);
  const published = saved.publishedVersion === saved.version && saved.version > 0;
  const locked = publish.isPending || !canEdit || stale;

  // What is on screen right now, for work that finishes after later edits.
  const latest = useRef({ value, dirty: draft.dirty });
  const inflight = useRef<Promise<SavedWeek> | null>(null);
  useEffect(() => {
    latest.current = { value, dirty: draft.dirty };
  });
  const clearDraft = draft.clear;
  useEffect(() => {
    if (adopted) clearDraft();
  }, [adopted, clearDraft]);

  const edit = (content: WeekContent) => {
    draft.setValue({ ...value, content });
    setError(null);
    setFailed(false);
  };
  const editProgram = (next: Program) => edit({ ...value.content, program: next });
  /** Saves what is on screen; edits made while the request travels stay as the next draft. */
  const persist = async (): Promise<SavedWeek> => {
    while (inflight.current) await inflight.current.catch(() => undefined);
    const { value: sent, dirty } = latest.current;
    if (!dirty && sent.version > 0) return sent;
    setSaving(true);
    const job = save.mutateAsync(sent);
    inflight.current = job;
    try {
      const result = await job;
      const now = latest.current.value;
      if (now === sent) {
        draft.clear();
        latest.current = { value: result, dirty: false };
      } else {
        const next = { ...now, version: result.version };
        draft.setValue(next);
        latest.current = { value: next, dirty: true };
      }
      return result;
    } finally {
      inflight.current = null;
      setSaving(false);
    }
  };
  const fail = (cause: unknown) => {
    setError(apiErrorMessage(cause, 'No se pudo guardar. Conservamos tus cambios.'));
    setFailed(true);
    if (cause && typeof cause === 'object' && 'response' in cause) {
      const response = cause.response as { status?: number };
      if (response?.status === 409) {
        setConflict(true);
        void reload();
      }
    }
  };
  const copyMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: Event) => {
      const menu = copyMenu.current;
      if (!menu?.open) return;
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menu.contains(e.target as Node))
        menu.open = false;
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);
  const drawer = useRef<HTMLElement>(null);
  const view = panel ?? (day ? 'day' : null);
  const focused = wide && view === 'day';
  // An opened panel may land above or below what is on screen: bring it into view and focus it.
  useEffect(() => {
    if (!panel) return;
    drawer.current?.scrollIntoView?.({ block: 'nearest' });
    drawer.current?.querySelector<HTMLButtonElement>('[aria-label="Cerrar panel"]')?.focus({
      preventScroll: true,
    });
  }, [panel]);
  const closePanel = () => {
    if (!panel) return onSelect(saved.weekStart, null);
    const opener =
      panel && document.querySelector<HTMLButtonElement>(`[data-week-panel="${panel}"]`);
    setPanel(null);
    if (opener) opener.focus();
  };
  const autosave = useRef<() => void>(() => undefined);
  useEffect(() => {
    autosave.current = () => void persist().catch(fail);
  });
  const waiting = draft.dirty && canEdit && !stale && !saving && !publish.isPending && !failed;
  useEffect(() => {
    if (!waiting || isCoachTourFrame()) return;
    const timer = window.setTimeout(() => autosave.current(), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [waiting, value]);

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
  const dateOf = (dayIndex: number, pattern: string) =>
    format(addDays(parseISO(saved.weekStart), dayIndex - 1), pattern);
  const tooMany = (dayIndex: number) =>
    setError(`El ${dayName(dayIndex)} ya tiene el máximo de ejercicios.`);
  /** Null means the change did not fit in the target day. */
  const apply = (next: Program | null, dayIndex: number) => {
    if (next) editProgram(next);
    else tooMany(dayIndex);
    return !!next;
  };
  const addExercises = (dayIndex: number, exercises: ProgramExercise[]) => {
    const base = addDay(program, 1, dayIndex);
    const current = findDay(base, 1, dayIndex)?.exercises.length ?? 0;
    if (current + exercises.length > MAX_EXERCISES_PER_DAY) return tooMany(dayIndex);
    editProgram(
      updateDay(base, 1, dayIndex, (day) => ({
        ...day,
        exercises: [...day.exercises, ...structuredClone(exercises)],
      })),
    );
  };
  const removeExercise = (dayIndex: number, index: number) => {
    const removed = findDay(program, 1, dayIndex)?.exercises[index];
    if (!removed) return;
    editProgram(
      updateDay(program, 1, dayIndex, (day) => ({
        ...day,
        exercises: day.exercises.filter((_, i) => i !== index),
      })),
    );
    const name = removed.exerciseName ?? removed.exerciseId;
    toast.success(
      (shown) => (
        <span className="week-undo">
          {name}: quitado del {dayName(dayIndex)}
          <button
            type="button"
            onClick={() => {
              const now = latest.current.value;
              const base = addDay(now.content.program, 1, dayIndex);
              draft.setValue({
                ...now,
                content: {
                  ...now.content,
                  program: updateDay(base, 1, dayIndex, (day) => ({
                    ...day,
                    exercises: [
                      ...day.exercises.slice(0, index),
                      removed,
                      ...day.exercises.slice(index),
                    ].slice(0, MAX_EXERCISES_PER_DAY),
                  })),
                },
              });
              toast.dismiss(shown.id);
            }}
          >
            Deshacer
          </button>
        </span>
      ),
      { duration: 6000 },
    );
  };
  const copyLastDay = (dayIndex: number, to: number) => {
    const day = lastWeek?.days.find((d) => d.dayIndex === dayIndex);
    if (day) void insert([{ ...structuredClone(day), week: 1, dayIndex: to }]);
  };
  // Days accept last week's sessions dragged from the side panel.
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
      const item = JSON.parse(data) as {
        kind: string;
        dayIndex?: number;
        id?: string;
        name?: string;
      };
      if (item.kind === 'exercise' && item.id)
        addExercises(dayIndex, [newExercise(item.id, item.name ?? item.id)]);
      if (item.kind === 'day' && item.dayIndex) copyLastDay(item.dayIndex, dayIndex);
      if (item.kind === 'move' && item.dayIndex && item.dayIndex !== dayIndex)
        void sendSession(item.dayIndex, dayIndex, true, 'replace');
    },
  });
  /** Copies or moves a whole session to another day, from its menu or by dragging it on the calendar. */
  async function sendSession(
    origin: number,
    to: number,
    move: boolean,
    clash: 'replace' | 'merge',
  ) {
    const before = program;
    const sent = findDay(program, 1, origin);
    const lost = findDay(program, 1, to);
    if (
      clash === 'replace' &&
      lost?.exercises.length &&
      !(await confirmAction({
        title: `Sustituir la sesión del ${dayName(to)}`,
        description: `Se perderá «${lost.name || 'Sesión'}» con ${lost.exercises.length} ${lost.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} y en su lugar quedará «${sent?.name || 'Sesión'}».`,
        confirmLabel: 'Sustituir sesión',
        destructive: true,
      }))
    )
      return;
    if (!apply(sendDay(program, origin, to, move, clash), to)) return;
    toast.success(
      (shown) => (
        <span className="week-undo">
          {sent?.name || 'Sesión'}: {move ? 'movida' : 'copiada'} al {dayName(to)}
          <button
            type="button"
            onClick={() => {
              const now = latest.current.value;
              draft.setValue({ ...now, content: { ...now.content, program: before } });
              toast.dismiss(shown.id);
            }}
          >
            Deshacer
          </button>
        </span>
      ),
      { duration: 6000 },
    );
  }
  const calendar = useAthleteCalendar(link, from, 4, { weekStart: saved.weekStart, program });
  const session = day ? findDay(program, 1, day) : undefined;
  const since = parseISO(shiftWeek(weekDate(), -HISTORY_WEEKS)).getTime();
  const recent = useClientData<CompletedWorkout[]>(
    link.linkId,
    `workouts/recent?since=${since}`,
    link.permissions.training,
  );
  const workouts = useMemo(
    () => [...(recent.data ?? [])].sort((a, b) => b.startedAt - a.startedAt),
    [recent.data],
  );
  const history = useMemo(() => exerciseUse(workouts), [workouts]);
  const openWeek = calendar.weeks.find((week) => week.weekStart === saved.weekStart);
  /** Opens the session wide with the cursor ready to look for an exercise. */
  const search = () => {
    onWide(true);
    setTimeout(
      () =>
        drawer.current
          ?.querySelector<HTMLInputElement>('.ex-panel input[aria-label^="Buscar ejercicio"]')
          ?.focus(),
      50,
    );
  };
  const facts = day ? openWeek?.days[day - 1] : undefined;
  const heading = day ? longDate(dateOf(day, 'yyyy-MM-dd')) : '';
  const title =
    view === 'day'
      ? heading.charAt(0).toUpperCase() + heading.slice(1)
      : (PANELS.find((option) => option.id === panel)?.label ?? '');
  // Leaving the week before the autosave fires would show the old plan on the calendar.
  const leave = useRef<() => void>(() => undefined);
  useEffect(() => {
    leave.current = () => {
      if (waiting && !inflight.current && !isCoachTourFrame())
        void save.mutateAsync(latest.current.value).catch(() => undefined);
    };
  });
  useEffect(() => () => leave.current(), []);
  const sets = program.days.flatMap((day) => day.exercises).reduce((n, e) => n + e.sets, 0);
  const status = saving
    ? 'Guardando…'
    : saved.weekStart < weekDate()
      ? 'Semana pasada · solo lectura'
      : failed
        ? 'No se pudo guardar'
        : draft.dirty
          ? 'Cambios sin guardar'
          : published
            ? 'Semana publicada'
            : saved.publishedVersion != null
              ? 'Cambios guardados · publica para que el atleta los vea'
              : saved.version > 0
                ? 'Borrador guardado · el atleta aún no lo ve'
                : 'Semana sin preparar';
  return (
    <section className="week-editor min-w-0" aria-label="Preparar semana">
      <header className="week-bar">
        {lead}
        <div className="week-bar-info">
          <h2 className="sr-only">
            Preparación · {formatCoachDate(saved.weekStart)} –{' '}
            {formatCoachDate(format(addDays(parseISO(saved.weekStart), 6), 'yyyy-MM-dd'))}
          </h2>
          <div className="week-bar-meta">
            <p role="status" data-dirty={draft.dirty || saving ? '' : undefined}>
              {status}
            </p>
            {failed && !stale && (
              <button
                type="button"
                className="week-bar-retry"
                onClick={() => {
                  setFailed(false);
                  setError(null);
                  void persist().catch(fail);
                }}
              >
                Reintentar
              </button>
            )}
            <p className="coach-week-counts">
              {program.days.length} {program.days.length === 1 ? 'sesión' : 'sesiones'} · {sets}{' '}
              series · {INTENTS[value.content.intent]}
            </p>
          </div>
        </div>
        {canEdit && (
          <span className="week-bar-publish" data-tour="week-publish">
            <button
              type="button"
              className="btn btn-primary"
              disabled={publish.isPending || stale || (published && !draft.dirty && !saving)}
              onClick={async () => {
                const problems = publishProblems(program);
                if (problems.length) {
                  setError(problems[0]);
                  return;
                }
                const sessions = program.days.length;
                const start =
                  saved.weekStart > format(new Date(), 'yyyy-MM-dd')
                    ? saved.weekStart
                    : format(new Date(), 'yyyy-MM-dd');
                if (
                  !(await confirmAction({
                    title: 'Publicar semana',
                    description: `El atleta verá ${sessions} ${sessions === 1 ? 'sesión' : 'sesiones'} (${sets} series) y tu comentario desde el ${formatCoachDate(start)}. Sustituye a lo que tuviera pautado a partir de ese día; los días ya pasados no se le marcan como pendientes.`,
                    confirmLabel: 'Publicar semana',
                  }))
                )
                  return;
                try {
                  const current = await persist();
                  await publish.mutateAsync(current.version);
                  toast.success('Semana publicada');
                } catch (cause) {
                  fail(cause);
                }
              }}
            >
              {publish.isPending ? 'Publicando…' : 'Publicar semana'}
            </button>
          </span>
        )}
        <div className="week-tools">
          <div className="week-tools-group" role="group" aria-label="Paneles de apoyo">
            {PANELS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="btn btn-secondary"
                data-week-panel={option.id}
                aria-pressed={!preview && panel === option.id}
                disabled={preview}
                onClick={() => setPanel(panel === option.id ? null : option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="week-tools-group">
            <details className="week-menu" data-tour="copy-menu" ref={copyMenu}>
              <summary className="btn btn-secondary">
                <Copy size={15} aria-hidden /> Copiar
                <ChevronDown size={14} aria-hidden />
              </summary>
              <div
                className="week-menu-items"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) copyMenu.current!.open = false;
                }}
              >
                <button
                  type="button"
                  data-tour="copy-week"
                  disabled={locked || !previous.data || previous.isFetching}
                  title={
                    !locked && !previous.data && !previous.isFetching
                      ? 'No hay una semana anterior publicada de la que partir'
                      : undefined
                  }
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
                    setPanel((current) => (current === 'previous' ? null : current));
                  }}
                >
                  Copiar semana anterior
                  <small>Parte de lo que pautaste la semana pasada</small>
                </button>
                <button
                  type="button"
                  title={
                    !locked && (!source || !lastWeek?.days.length)
                      ? 'No hay una semana anterior publicada de la que partir'
                      : 'Copia la semana anterior con las cargas y repeticiones que el atleta registró'
                  }
                  disabled={locked || !source || !lastWeek?.days.length || copyingDone}
                  onClick={async () => {
                    if (!lastWeek || !source) return;
                    if (
                      program.days.length &&
                      !(await confirmAction({
                        title: 'Copiar lo registrado',
                        description:
                          'Se sustituirán los días del borrador por la semana anterior, con las cargas y repeticiones que el atleta registró. Las notas privadas y la decisión se conservan.',
                        confirmLabel: 'Copiar lo registrado',
                        destructive: true,
                      }))
                    )
                      return;
                    setCopyingDone(true);
                    try {
                      const done = await fetchDone(
                        saved.linkId,
                        source.id,
                        shiftWeek(saved.weekStart, -1),
                      );
                      const next = withDone(structuredClone(lastWeek), done);
                      if (!next.changed) {
                        setError(
                          'El atleta no registró ningún ejercicio de la semana anterior. Usa «Copiar semana anterior» para partir de lo pautado.',
                        );
                        return;
                      }
                      editProgram({ ...next.program, name: program.name });
                      toast.success(
                        `Copiado lo que hizo en ${next.changed} ${next.changed === 1 ? 'ejercicio' : 'ejercicios'}; el resto queda como estaba pautado`,
                      );
                    } catch (e) {
                      setError(
                        apiErrorMessage(e, 'No se pudieron cargar los entrenamientos registrados'),
                      );
                    } finally {
                      setCopyingDone(false);
                    }
                  }}
                >
                  {copyingDone ? 'Copiando…' : 'Copiar lo registrado'}
                  <small>La semana pasada con los kilos y repeticiones que hizo</small>
                </button>
                <button
                  type="button"
                  disabled={!program.days.length}
                  title={
                    program.days.length
                      ? 'Copia la semana como texto para pegarla en un mensaje'
                      : 'Añade alguna sesión para poder copiarla'
                  }
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(weekText(program, saved.weekStart))
                      .then(() => toast.success('Semana copiada como texto'))
                      .catch(() =>
                        toast.error('No se pudo copiar. Revisa los permisos del navegador.'),
                      )
                  }
                >
                  Copiar como texto
                  <small>Para pegar esta semana en un mensaje</small>
                </button>
              </div>
            </details>
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
          </div>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      {saved.linkedFrom ? (
        <p className="week-linked">
          {draft.dirty
            ? `Si estos cambios tocan las sesiones, al guardarlos esta semana dejará de seguir a la del ${formatCoachDate(saved.linkedFrom)}. El tipo de semana y las notas no cuentan.`
            : `Esta semana repite la del ${formatCoachDate(saved.linkedFrom)} y cambia con ella. Si editas sus sesiones aquí, deja de seguirla.`}
        </p>
      ) : (
        followed.from && (
          <p className="week-linked" role="status">
            Esta semana ya no sigue a la del {formatCoachDate(followed.from)}: ahora tiene sus
            propias sesiones. Para enlazarla otra vez, repite aquella semana desde Bloque.
          </p>
        )
      )}
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
                  setFailed(false);
                  setError(null);
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
      <div
        className="cal-body"
        data-panel={view ? (focused ? 'wide' : '') : undefined}
        hidden={preview}
      >
        {focused && openWeek && day ? (
          <WeekStrip
            week={openWeek}
            selected={day}
            onSelect={(next) => onSelect(saved.weekStart, next)}
            onClose={() => onWide(false)}
            drop={dropTarget}
            dragType={DRAG_TYPE}
            editable={!locked}
          />
        ) : (
          <AthleteCalendar
            weeks={calendar.weeks}
            focus={saved.weekStart}
            selected={panel ? null : day}
            loading={calendar.isLoading}
            onSelect={(week, next) => {
              setPanel(null);
              onSelect(week, next);
              // Stacked under the calendar, a picked day would open out of sight.
              if (next && !window.matchMedia?.('(min-width: 1100px)').matches)
                requestAnimationFrame(() =>
                  drawer.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }),
                );
            }}
            drop={dropTarget}
            dragType={DRAG_TYPE}
            editable={!locked}
          />
        )}
        <aside
          ref={drawer}
          className="cal-panel"
          hidden={!view}
          aria-label={title}
          onKeyDown={(e) => {
            if (e.key !== 'Escape' || e.defaultPrevented) return;
            e.stopPropagation();
            closePanel();
          }}
        >
          <div className="card week-panel">
            <header className="week-panel-head">
              <h3>{title}</h3>
              {view === 'day' && day && (
                <>
                  <button
                    type="button"
                    className="set-icon"
                    aria-label="Día anterior"
                    onClick={() =>
                      day > 1
                        ? onSelect(saved.weekStart, day - 1)
                        : onSelect(shiftWeek(saved.weekStart, -1), 7)
                    }
                  >
                    <ChevronLeft size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="set-icon"
                    aria-label="Día siguiente"
                    onClick={() =>
                      day < 7
                        ? onSelect(saved.weekStart, day + 1)
                        : onSelect(shiftWeek(saved.weekStart, 1), 1)
                    }
                  >
                    <ChevronRight size={18} aria-hidden />
                  </button>
                </>
              )}
              {view === 'day' && !focused && (
                <button
                  type="button"
                  className="btn btn-secondary week-panel-wide"
                  title="Pliega el calendario y abre la sesión a lo ancho, con los ejercicios al lado"
                  onClick={() => onWide(true)}
                >
                  <Maximize2 size={14} aria-hidden /> Ampliar
                </button>
              )}
              <button
                type="button"
                className="set-icon"
                aria-label="Cerrar panel"
                onClick={closePanel}
              >
                <X size={18} aria-hidden />
              </button>
            </header>
            {view === 'day' && day && (
              <AthleteHistory.Provider value={history}>
                <div className="week-panel-body cal-day-body" data-wide={focused ? '' : undefined}>
                  <div className="cal-day-main" {...(focused ? dropTarget(day) : {})}>
                    <fieldset disabled={locked} className="cal-fieldset">
                      <DaySession
                        key={day}
                        wide={focused}
                        onSearch={search}
                        label={`${WEEKDAY_LABELS[day - 1]} ${dateOf(day, 'dd/MM')}`}
                        weekday={dayName(day)}
                        day={session}
                        lastDay={lastWeek?.days.find((d) => d.dayIndex === day)}
                        others={WEEKDAY_LABELS.flatMap((other, j) =>
                          j === day - 1
                            ? []
                            : [{ value: j + 1, label: other, busy: !!findDay(program, 1, j + 1) }],
                        )}
                        readOnly={!canEdit}
                        onChange={(change) => editProgram(updateDay(program, 1, day, change))}
                        onAdd={() => editProgram(addDay(program, 1, day))}
                        onRepeat={() => copyLastDay(day, day)}
                        onRemove={async () => {
                          if (
                            !session?.exercises.length ||
                            (await confirmAction({
                              title: 'Quitar sesión',
                              description: `¿Quitar «${session.name}» del borrador?`,
                              confirmLabel: 'Quitar sesión',
                              destructive: true,
                            }))
                          )
                            editProgram(removeDay(program, 1, day));
                        }}
                        onSendDay={(to, move, clash) => void sendSession(day, to, move, clash)}
                        onSendExercise={(index, to, move) => {
                          const name = session?.exercises[index]?.exerciseName ?? 'Ejercicio';
                          if (apply(sendExercise(program, day, index, to, move), to))
                            toast.success(
                              `${name}: ${move ? 'movido' : 'copiado'} al ${dayName(to)}`,
                            );
                        }}
                        onRemoveExercise={(index) => removeExercise(day, index)}
                        onReorder={(from, to) =>
                          apply(sendExercise(program, day, from, day, true, to), day)
                        }
                      />
                    </fieldset>
                    {facts && <DayFacts day={facts} link={link} />}
                  </div>
                  {focused && (
                    <ExercisePanel
                      linkId={link.linkId}
                      athlete={personName(link.client).split(' ')[0]}
                      workouts={workouts}
                      current={session?.exercises.map((exercise) => exercise.exerciseId) ?? []}
                      disabled={locked}
                      dragType={DRAG_TYPE}
                      onAdd={(exercise) =>
                        addExercises(day, [newExercise(exercise.id, exercise.name)])
                      }
                    />
                  )}
                </div>
              </AthleteHistory.Provider>
            )}
            <fieldset disabled={locked} className="cal-fieldset" hidden={!panel}>
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
                <LibraryInsert
                  onInsert={(days) => void insert(days)}
                  onAddExercises={addExercises}
                />
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
                    Qué cambias esta semana y por qué
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
            </fieldset>
          </div>
        </aside>
      </div>
      <div className="week-context">
        <WeekVolume program={program} last={lastWeek} />
        {value.content.decision && (
          <p className="week-decision">
            {published && !draft.dirty ? 'Decisión publicada' : 'Decisión sin publicar'}:{' '}
            {value.content.decision}
          </p>
        )}
      </div>
    </section>
  );
}
