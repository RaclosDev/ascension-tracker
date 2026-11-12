import { confirmAction } from '../lib/confirmation';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { apiErrorMessage } from '../lib/coach/api';
import { useSessionDraft } from '../hooks/useSessionDraft';
import { ProgramPreview } from '../components/coach/ProgramPreview';
import {
  MAX_WEEKS,
  WEEKDAY_LABELS,
  addDay,
  copyDay,
  copyWeek,
  emptyProgram,
  findDay,
  programProblems,
  publishProblems,
  isProgramDraft,
  removeDay,
  setWeeks,
  updateDay,
  useCoachProgram,
  useSaveProgram,
  type Program,
} from '../lib/coach/coachPrograms';
import { WeekBar } from '../components/coach/editor/WeekBar';
import { DayEditor } from '../components/coach/editor/DayEditor';
import { inputClass, inputStyle } from '../components/coach/editor/fields';

const NEW_ID = 'nuevo';

/** Builder for one library program: weeks, the days of each week and the prescribed exercises. */
export default function CoachProgramEditorPage() {
  const { programId = NEW_ID } = useParams();
  const isNew = programId === NEW_ID;
  const [search] = useSearchParams();
  const kind = search.get('tipo');
  const fresh = { ...emptyProgram(), weeks: kind === 'sesion' || kind === 'semana' ? 1 : 4 };
  const loaded = useCoachProgram(isNew ? null : programId);

  if (!isNew && loaded.isLoading) {
    return <Shell>{<p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}</Shell>;
  }
  if (!isNew && (loaded.isError || !loaded.data)) {
    return (
      <Shell>
        <p role="alert">{apiErrorMessage(loaded.error, 'No se encontró el programa.')}</p>
      </Shell>
    );
  }
  // Keyed so a different program (or a fresh save) starts from its own data.
  return (
    <ProgramEditor
      key={`${programId}:${kind}:${loaded.data?.updatedAt ?? ''}`}
      initial={isNew ? (kind === 'sesion' ? addDay(fresh, 1, 1) : fresh) : (loaded.data as Program)}
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in max-w-6xl mx-auto px-4 pt-2 sm:pt-4">
      <Link to="/entrenador/programas" className="btn btn-secondary mb-4">
        <ArrowLeft size={16} aria-hidden /> Programas
      </Link>
      {children}
    </div>
  );
}

interface IndividualPublication {
  returnTo: string;
  clientName: string;
  pending: boolean;
  controls: React.ReactNode;
  publish: (program: Program) => Promise<boolean>;
}

export function ProgramEditor({
  initial,
  publication,
}: {
  initial: Program;
  publication?: IndividualPublication;
}) {
  const navigate = useNavigate();
  const save = useSaveProgram();
  const pending = save.isPending || publication?.pending;
  const draft = useSessionDraft(
    `program:${initial.id ?? `new:${initial.weeks}:${initial.days.length}`}`,
    initial,
    isProgramDraft,
  );
  const program = draft.value;
  const dirty = draft.dirty;
  const stale = dirty && program.updatedAt !== initial.updatedAt;
  const [week, setWeek] = useState(1);
  const [preview, setPreview] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const problems = useMemo(() => programProblems(program), [program]);

  const edit = (change: (p: Program) => Program) => {
    draft.setValue(change(program));
    setSaveError(null);
  };

  const onSave = (status: 'DRAFT' | 'READY', asCopy = false) => {
    const errors = status === 'READY' ? publishProblems(program) : problems;
    if (errors.length > 0) {
      setSaveError(errors[0]);
      return;
    }
    setSaveError(null);
    if (publication) {
      void publication
        .publish({ ...program, status: 'READY' })
        .then((published) => {
          if (!published) return;
          draft.clear();
          toast.success('Adaptación publicada');
          navigate(publication.returnTo, { replace: true });
        })
        .catch((error: unknown) =>
          setSaveError(apiErrorMessage(error, 'No se pudo publicar. Conservamos tus cambios.')),
        );
      return;
    }
    save.mutate(
      { ...program, status, ...(asCopy ? { id: null, updatedAt: null } : {}) },
      {
        onSuccess: (saved) => {
          toast.success(status === 'READY' ? 'Programa listo para asignar' : 'Borrador guardado');
          draft.clear();
          if (saved.id && program.id !== saved.id) {
            navigate(`/entrenador/programas/${saved.id}`, { replace: true });
          }
        },
        onError: (e) =>
          setSaveError(
            apiErrorMessage(e, 'No se pudo guardar el programa. Conservamos tus cambios.'),
          ),
      },
    );
  };

  const currentWeek = Math.min(week, program.weeks);

  return (
    <div className="fade-in max-w-6xl mx-auto px-4 pt-2 sm:pt-4 pb-16">
      <header className="mb-4 pb-2 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={publication?.returnTo ?? '/entrenador/programas'}
            aria-label={publication ? 'Volver al atleta' : 'Volver a programas'}
            className="btn btn-secondary"
            onClick={async (e) => {
              if (!dirty) return;
              e.preventDefault();
              if (
                await confirmAction({
                  title: 'Salir del editor',
                  description: `Tienes cambios sin guardar. ${draft.notice ?? ''}`.trim(),
                  confirmLabel: 'Salir del editor',
                })
              ) {
                navigate(publication?.returnTo ?? '/entrenador/programas');
              }
            }}
          >
            <ArrowLeft size={16} aria-hidden />
          </Link>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {publication ? 'Adaptar programa' : program.id ? 'Editar programa' : 'Nuevo programa'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'Volver al editor' : 'Vista previa'}
          </button>
          {!publication && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={
                pending || stale || (!dirty && program.id != null && program.status === 'DRAFT')
              }
              onClick={() => onSave('DRAFT')}
            >
              <Save size={16} aria-hidden /> Guardar borrador
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || stale || (!publication && !dirty && program.status === 'READY')}
            onClick={() => onSave('READY')}
          >
            {publication ? 'Publicar adaptación' : 'Guardar listo para asignar'}
          </button>
        </div>
      </header>

      {publication ? (
        <section className="card mb-3">
          <p>
            Adaptación solo para <strong>{publication.clientName}</strong>. La versión actual
            continúa hasta la fecha elegida; entonces empieza la nueva copia desde la semana 1. La
            biblioteca y los entrenamientos registrados se conservan.
          </p>
          {publication.controls}
        </section>
      ) : (
        <p className="text-sm mb-3">
          {initial.status === 'READY'
            ? 'Versión guardada: lista para asignar.'
            : 'Borrador de biblioteca.'}{' '}
          Guardar aquí no cambia los programas que ya tienen tus atletas. La asignación se publica
          desde cada ficha.
        </p>
      )}
      {draft.notice && (
        <p role="status" className="text-sm mb-3">
          {draft.notice}
        </p>
      )}
      {saveError && (
        <p role="alert" className="card mb-3">
          {saveError}
        </p>
      )}
      {stale && !publication && (
        <div role="alert" className="card mb-3">
          <p>
            La versión guardada ha cambiado desde que empezaste este borrador. Puedes conservar tus
            cambios como un programa nuevo o descartarlos para cargar la versión actual.
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-2"
            disabled={pending}
            onClick={() => onSave('DRAFT', true)}
          >
            Guardar como nuevo borrador
          </button>
        </div>
      )}
      {dirty && (
        <button
          type="button"
          className="btn btn-secondary mb-3"
          disabled={pending}
          onClick={async () => {
            if (
              await confirmAction({
                title: 'Descartar cambios',
                description: '¿Descartar los cambios locales y volver a la versión guardada?',
                confirmLabel: 'Descartar cambios',
                destructive: true,
              })
            ) {
              draft.clear();
              setSaveError(null);
            }
          }}
        >
          Descartar cambios locales
        </button>
      )}

      {preview ? (
        <ProgramPreview program={program} />
      ) : (
        <fieldset disabled={pending} className="min-w-0">
          <section className="card mb-4 grid gap-3 sm:grid-cols-[1fr_8rem]">
            <label className="flex flex-col gap-1">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Nombre
              </span>
              <input
                className={inputClass}
                style={inputStyle}
                maxLength={120}
                value={program.name}
                onChange={(e) => edit((p) => ({ ...p, name: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Semanas
              </span>
              <input
                className={inputClass}
                style={inputStyle}
                type="number"
                min={1}
                max={MAX_WEEKS}
                value={program.weeks}
                onChange={async (e) => {
                  const weeks = Number(e.target.value);
                  const dropped = program.days.filter((d) => d.week > weeks).length;
                  if (
                    dropped > 0 &&
                    !(await confirmAction({
                      title: 'Reducir semanas',
                      description: `Se borrarán ${dropped} días de las semanas que quitas. ¿Seguir?`,
                      confirmLabel: 'Reducir semanas',
                      destructive: true,
                    }))
                  )
                    return;
                  edit((p) => setWeeks(p, weeks));
                }}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Notas para el atleta
              </span>
              <textarea
                className={inputClass}
                style={inputStyle}
                rows={2}
                maxLength={2000}
                value={program.notes ?? ''}
                onChange={(e) => edit((p) => ({ ...p, notes: e.target.value || null }))}
              />
            </label>
          </section>

          {problems.length > 0 && dirty && !saveError && (
            <ul
              className="card mb-4 text-sm flex flex-col gap-1"
              aria-label="Problemas del programa"
            >
              {problems.slice(0, 5).map((problem) => (
                <li key={problem} style={{ color: 'var(--danger, #f87171)' }}>
                  {problem}
                </li>
              ))}
            </ul>
          )}

          <WeekBar
            weeks={program.weeks}
            current={currentWeek}
            onSelect={setWeek}
            onCopy={async (to) => {
              if (
                program.days.some((d) => d.week === to) &&
                !(await confirmAction({
                  title: `Sustituir la semana ${to}`,
                  description: `Se copiarán los entrenamientos de la semana ${currentWeek} a la semana ${to}. Todo el contenido de la semana de destino se sustituirá, incluidas sus cargas y notas. La semana de origen se conserva.`,
                  confirmLabel: 'Sustituir semana',
                  destructive: true,
                }))
              )
                return;
              edit((p) => copyWeek(p, currentWeek, to));
              setWeek(to);
            }}
          />

          <div className="flex flex-col gap-3">
            {WEEKDAY_LABELS.map((label, i) => {
              const dayIndex = i + 1;
              const day = findDay(program, currentWeek, dayIndex);
              if (!day) {
                return (
                  <div key={dayIndex} className="card flex items-center justify-between gap-3 py-3">
                    <span style={{ color: 'var(--text-secondary)' }}>{label} · descanso</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-label={`Añadir entrenamiento el ${label.toLowerCase()}`}
                      onClick={() => edit((p) => addDay(p, currentWeek, dayIndex))}
                    >
                      <Plus size={16} aria-hidden /> Añadir día
                    </button>
                  </div>
                );
              }
              return (
                <DayEditor
                  key={dayIndex}
                  label={label}
                  day={day}
                  weeks={program.weeks}
                  onChange={(change) => edit((p) => updateDay(p, currentWeek, dayIndex, change))}
                  onRemove={async () => {
                    if (
                      day.exercises.length > 0 &&
                      !(await confirmAction({
                        title: 'Quitar día de entrenamiento',
                        description: `¿Quitar «${day.name}» y sus ${day.exercises.length} ejercicios?`,
                        confirmLabel: 'Quitar día',
                        destructive: true,
                      }))
                    )
                      return;
                    edit((p) => removeDay(p, currentWeek, dayIndex));
                  }}
                  onCopy={async (to) => {
                    if (
                      findDay(program, to.week, to.dayIndex) &&
                      !(await confirmAction({
                        title: 'Sustituir entrenamiento',
                        description: `Se copiará «${day.name}» al ${WEEKDAY_LABELS[to.dayIndex - 1].toLowerCase()} de la semana ${to.week}. Se sustituirán los ejercicios, cargas y notas de ese día. El entrenamiento de origen se conserva.`,
                        confirmLabel: 'Sustituir entrenamiento',
                        destructive: true,
                      }))
                    )
                      return;
                    edit((p) => copyDay(p, { week: currentWeek, dayIndex }, to));
                    toast.success(
                      `Copiado a semana ${to.week}, ${WEEKDAY_LABELS[to.dayIndex - 1]}`,
                    );
                  }}
                />
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
