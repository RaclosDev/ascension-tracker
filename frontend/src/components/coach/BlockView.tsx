import { useState, type ReactNode } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage, personName, type CoachClient } from '@/lib/coach/api';
import {
  BLOCK_LENGTHS,
  BLOCK_NAME_MAX,
  WEEK_STATE,
  blockLoad,
  blockProgram,
  publishable,
  useCoachBlock,
  useDeleteBlock,
  usePublishBlock,
  useRepeatWeek,
  useSaveBlock,
  useSetWeekIntent,
  weekState,
} from '@/lib/coach/blocks';
import { useSaveProgram, WEEKDAY_LABELS } from '@/lib/coach/coachPrograms';
import { INTENTS, shiftWeek, weekDate, type SavedWeek } from '@/lib/coach/weeks';
import { confirmAction } from '@/lib/confirmation';
import { SectionSkeleton } from './SectionSkeleton';
import { usePrescribing } from './editor/prescribing';
import '../../styles/coach-block.css';

const day = (iso: string, pattern = 'd MMM') => format(parseISO(iso), pattern, { locale: es });
const span = (week: string) =>
  `${day(week)} – ${day(format(addDays(parseISO(week), 6), 'yyyy-MM-dd'))}`;
const list = (items: string[]) => new Intl.ListFormat('es', { type: 'conjunction' }).format(items);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface Props {
  link: CoachClient;
  /** The switch between preparing, the block and the review. */
  lead: ReactNode;
  onOpenWeek: (week: string) => void;
}

/** Several weeks of one athlete at a glance: what each holds, how they relate and how the load moves. */
export function BlockView({ link, lead, onOpenWeek }: Props) {
  const id = link.linkId;
  const canEdit = link.permissions.editTraining;
  const today = weekDate();
  const [range, setRange] = useState<{ from: string; count: number } | null>(null);
  const [panel, setPanel] = useState<'block' | 'library' | null>(null);
  const [repeating, setRepeating] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [name, setName] = useState('');
  const fallback = { from: today, count: 4 };
  const first = useCoachBlock(id, (range ?? fallback).from, (range ?? fallback).count);
  const defined = first.data?.block ?? null;
  // Until the coach moves the range, the athlete's own block decides which weeks are on screen.
  const shown = range ?? (defined ? { from: defined.startWeek, count: defined.weeks } : fallback);
  const block = useCoachBlock(id, shown.from, shown.count);
  const { muscleOf } = usePrescribing();
  const saveBlock = useSaveBlock(id);
  const deleteBlock = useDeleteBlock(id);
  const publish = usePublishBlock(id);
  const repeat = useRepeatWeek(id);
  const setIntent = useSetWeekIntent(id);
  const saveProgram = useSaveProgram();

  if (block.isPending)
    return <BlockFrame lead={lead}>{<SectionSkeleton label="Cargando bloque…" />}</BlockFrame>;
  if (block.isError)
    return (
      <BlockFrame lead={lead}>
        <p role="alert">
          No se pudo cargar el bloque.{' '}
          <button type="button" className="btn btn-secondary" onClick={() => void block.refetch()}>
            Reintentar
          </button>
        </p>
      </BlockFrame>
    );

  const weeks = block.data.weeks;
  const last = shiftWeek(shown.from, shown.count - 1);
  const blockEnd = defined ? shiftWeek(defined.startWeek, defined.weeks - 1) : null;
  const matchesBlock = defined?.startWeek === shown.from && defined.weeks === shown.count;
  const ready = publishable(weeks);
  const incomplete = weeks.filter((week) => weekState(week) === 'incomplete').length;
  const withSessions = weeks.filter((week) => week.content.program.days.length);
  const load = blockLoad(weeks, muscleOf);
  const lengths = [...new Set([...BLOCK_LENGTHS, shown.count])].sort((a, b) => a - b);
  const fail = (fallbackMessage: string) => (error: unknown) =>
    void toast.error(apiErrorMessage(error, fallbackMessage));
  const move = (from: string, count = shown.count) => {
    setRange({ from, count });
    setRepeating(null);
  };
  const open = (next: typeof panel) => {
    setPanel(panel === next ? null : next);
    setName(
      next === 'block'
        ? (defined?.name ?? '')
        : (defined?.name ?? `Bloque de ${personName(link.client)}`).slice(0, BLOCK_NAME_MAX),
    );
  };

  const publishAll = async () => {
    const accepted = await confirmAction({
      title: `Publicar ${plural(ready.length, 'semana', 'semanas')}`,
      description: `${personName(link.client)} verá ${ready.length === 1 ? 'la semana' : 'las semanas'} del ${list(
        ready.map((week) => day(week.weekStart)),
      )} en cuanto ${ready.length === 1 ? 'la' : 'las'} publiques.`,
      confirmLabel: 'Publicar',
    });
    if (!accepted) return;
    publish.mutate(ready, {
      onSuccess: () =>
        toast.success(`${plural(ready.length, 'semana publicada', 'semanas publicadas')}`),
      onError: fail('No se pudieron publicar las semanas. No se ha publicado ninguna.'),
    });
  };

  const startRepeat = (week: SavedWeek) => {
    setRepeating(repeating === week.weekStart ? null : week.weekStart);
    setTargets([]);
  };

  return (
    <BlockFrame lead={lead}>
      <header className="block-head">
        <div className="block-head-title">
          <h3>{matchesBlock && defined ? defined.name : 'Varias semanas'}</h3>
          <p>
            {day(shown.from)} –{' '}
            {day(format(addDays(parseISO(last), 6), 'yyyy-MM-dd'), 'd MMM yyyy')}
            {defined && !matchesBlock && (
              <>
                {' · '}
                <button
                  type="button"
                  className="block-link"
                  onClick={() => move(defined.startWeek, defined.weeks)}
                >
                  Volver a «{defined.name}»
                </button>
              </>
            )}
          </p>
        </div>
        <div className="block-range">
          <button
            type="button"
            className="btn btn-secondary"
            aria-label="Empezar una semana antes"
            onClick={() => move(shiftWeek(shown.from, -1))}
          >
            <ArrowLeft size={16} aria-hidden />
          </button>
          <label>
            <span className="sr-only">Semanas a la vista</span>
            <select
              className="form-input min-h-11"
              value={shown.count}
              onChange={(event) => move(shown.from, Number(event.target.value))}
            >
              {lengths.map((length) => (
                <option key={length} value={length}>
                  {length} semanas
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            aria-label="Empezar una semana después"
            disabled={last >= shiftWeek(today, 52)}
            onClick={() => move(shiftWeek(shown.from, 1))}
          >
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </header>

      {canEdit && (
        <div className="block-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready.length || publish.isPending}
            onClick={() => void publishAll()}
          >
            {ready.length
              ? `Publicar ${plural(ready.length, 'semana', 'semanas')}`
              : 'Nada por publicar'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            aria-expanded={panel === 'block'}
            onClick={() => open('block')}
          >
            {defined ? 'Editar bloque' : 'Guardar como bloque'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            aria-expanded={panel === 'library'}
            disabled={!withSessions.length}
            onClick={() => open('library')}
          >
            Guardar en la biblioteca
          </button>
          {incomplete > 0 && (
            <p className="block-hint">
              {plural(incomplete, 'semana incompleta', 'semanas incompletas')}: ábrela para ver qué
              le falta antes de publicarla.
            </p>
          )}
        </div>
      )}

      {panel === 'block' && (
        <form
          className="block-panel"
          onSubmit={(event) => {
            event.preventDefault();
            saveBlock.mutate(
              { name: name.trim(), startWeek: shown.from, weeks: shown.count },
              {
                onSuccess: () => {
                  toast.success('Bloque guardado');
                  setPanel(null);
                },
                onError: fail('No se pudo guardar el bloque.'),
              },
            );
          }}
        >
          <label>
            Nombre del bloque
            <input
              className="form-input min-h-11"
              value={name}
              maxLength={BLOCK_NAME_MAX}
              required
              placeholder="Fuerza base, Volumen de otoño…"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <p>
            {shown.count < 2
              ? 'Un bloque tiene al menos dos semanas.'
              : `Abarca las ${shown.count} semanas que ves, del ${day(shown.from)} al ${day(
                  format(addDays(parseISO(last), 6), 'yyyy-MM-dd'),
                )}. En la última, el seguimiento de ${personName(link.client)} añade dos preguntas de fin de bloque.`}
          </p>
          <div className="block-panel-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || shown.count < 2 || saveBlock.isPending}
            >
              {defined ? 'Guardar cambios' : 'Guardar bloque'}
            </button>
            {defined && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleteBlock.isPending}
                onClick={() =>
                  deleteBlock.mutate(undefined, {
                    onSuccess: () => {
                      toast.success('Bloque quitado. Las semanas siguen como estaban.');
                      setPanel(null);
                    },
                    onError: fail('No se pudo quitar el bloque.'),
                  })
                }
              >
                Quitar bloque
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setPanel(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {panel === 'library' && (
        <form
          className="block-panel"
          onSubmit={(event) => {
            event.preventDefault();
            saveProgram.mutate(blockProgram(name.trim(), weeks), {
              onSuccess: () => {
                toast.success(
                  'Guardado en Biblioteca › Programas. Desde allí puedes aplicarlo a otro atleta.',
                );
                setPanel(null);
              },
              onError: fail('No se pudo guardar en la biblioteca.'),
            });
          }}
        >
          <label>
            Nombre en la biblioteca
            <input
              className="form-input min-h-11"
              value={name}
              maxLength={BLOCK_NAME_MAX}
              required
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <p>
            Se guarda una copia de las sesiones de estas semanas como programa, sin notas privadas
            ni datos de {personName(link.client)}. Lo encontrarás en Biblioteca › Programas para
            aplicarlo a otros atletas.
          </p>
          <div className="block-panel-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || saveProgram.isPending}
            >
              Guardar copia
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setPanel(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ol className="block-weeks">
        {weeks.map((week, index) => {
          const state = weekState(week, today);
          const editable = canEdit && week.weekStart >= today;
          const followers = weeks.filter((other) => other.linkedFrom === week.weekStart).length;
          const sessions = week.content.program.days;
          const options = weeks.filter(
            (other) => other.weekStart >= today && other.weekStart !== week.weekStart,
          );
          return (
            <li key={week.weekStart} className="block-week" data-state={state}>
              <div className="block-week-head">
                <button
                  type="button"
                  className="block-week-open"
                  onClick={() => onOpenWeek(week.weekStart)}
                >
                  <strong>Semana {index + 1}</strong>
                  <span>{span(week.weekStart)}</span>
                </button>
                <p className="block-week-state">
                  <span data-state={state}>{WEEK_STATE[state]}</span>
                  {week.weekStart === today && <span>Esta semana</span>}
                  {week.weekStart === blockEnd && <span>Fin de bloque</span>}
                </p>
              </div>
              <label className="block-week-intent">
                <span className="sr-only">Tipo de la semana {index + 1}</span>
                <select
                  className="form-input min-h-11"
                  value={week.content.intent}
                  disabled={!editable || setIntent.isPending}
                  onChange={(event) =>
                    setIntent.mutate(
                      { week, intent: event.target.value as keyof typeof INTENTS },
                      { onError: fail('No se pudo cambiar el tipo de semana.') },
                    )
                  }
                >
                  {Object.entries(INTENTS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {sessions.length ? (
                <ul className="block-days" aria-label={`Sesiones de la semana ${index + 1}`}>
                  {WEEKDAY_LABELS.map((label, weekday) => {
                    const session = sessions.find((item) => item.dayIndex === weekday + 1);
                    return (
                      <li key={label} data-empty={session ? undefined : ''}>
                        <span>{label.slice(0, 3)}</span>
                        {session ? (
                          <>
                            <strong>{session.name || 'Sesión'}</strong>
                            <small>
                              {plural(session.exercises.length, 'ejercicio', 'ejercicios')}
                            </small>
                          </>
                        ) : (
                          <small aria-label="Sin sesión">—</small>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="block-days-empty">
                  {week.weekStart < today ? 'No se preparó esta semana.' : 'Sin sesiones todavía.'}
                </p>
              )}
              <div className="block-week-foot">
                {week.linkedFrom && (
                  <p>
                    Repite la semana del {day(week.linkedFrom)}: cambia con ella hasta que edites
                    sus sesiones.
                  </p>
                )}
                {followers > 0 && (
                  <p>
                    {plural(
                      followers,
                      'semana la repite y sigue sus cambios.',
                      'semanas la repiten y siguen sus cambios.',
                    )}
                  </p>
                )}
                <div className="block-week-actions">
                  <button
                    type="button"
                    className="block-link"
                    onClick={() => onOpenWeek(week.weekStart)}
                  >
                    {week.weekStart < today ? 'Revisar' : sessions.length ? 'Abrir' : 'Preparar'}
                  </button>
                  {canEdit && week.version > 0 && sessions.length > 0 && options.length > 0 && (
                    <button
                      type="button"
                      className="block-link"
                      aria-expanded={repeating === week.weekStart}
                      onClick={() => startRepeat(week)}
                    >
                      Repetir en…
                    </button>
                  )}
                </div>
              </div>
              {repeating === week.weekStart && (
                <form
                  className="block-panel block-repeat"
                  onSubmit={(event) => {
                    event.preventDefault();
                    repeat.mutate(
                      { source: week.weekStart, targets },
                      {
                        onSuccess: () => {
                          toast.success(
                            `Repetida en ${plural(targets.length, 'semana', 'semanas')}`,
                          );
                          setRepeating(null);
                        },
                        onError: fail('No se pudo repetir la semana.'),
                      },
                    );
                  }}
                >
                  <fieldset>
                    <legend>Repetir las sesiones de la semana {index + 1} en</legend>
                    {options.map((other) => {
                      const count = other.content.program.days.length;
                      return (
                        <label key={other.weekStart}>
                          <input
                            type="checkbox"
                            checked={targets.includes(other.weekStart)}
                            onChange={(event) =>
                              setTargets(
                                event.target.checked
                                  ? [...targets, other.weekStart]
                                  : targets.filter((target) => target !== other.weekStart),
                              )
                            }
                          />
                          <span>
                            Semana {weeks.indexOf(other) + 1} · {span(other.weekStart)}
                            {count > 0 && (
                              <small> · sustituye sus {plural(count, 'sesión', 'sesiones')}</small>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </fieldset>
                  <p>
                    Cada semana conserva su tipo y sus notas, y queda como borrador hasta que la
                    publiques. Si después cambias esta semana, las que la repiten cambian con ella.
                  </p>
                  <div className="block-panel-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!targets.length || repeat.isPending}
                    >
                      {targets.length
                        ? `Repetir en ${plural(targets.length, 'semana', 'semanas')}`
                        : 'Elige semanas'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setRepeating(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ol>

      {load.groups.length > 0 && (
        <section className="block-load" aria-labelledby="block-load-title">
          <h3 id="block-load-title">Series por grupo muscular y semana</h3>
          <p>Cuanto más marcada la celda, más series de ese grupo en esa semana.</p>
          <div className="block-load-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Grupo</th>
                  {weeks.map((week, index) => (
                    <th scope="col" key={week.weekStart}>
                      S{index + 1}
                      <small>{day(week.weekStart, 'd/M')}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {load.groups.map((group) => (
                  <tr key={group.id}>
                    <th scope="row">{group.label}</th>
                    {group.sets.map((sets, index) => (
                      <td
                        key={weeks[index].weekStart}
                        style={{ '--heat': sets / load.max } as React.CSSProperties}
                      >
                        {sets || <span aria-label="0">·</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Series totales</th>
                  {load.weeks.map((week, index) => (
                    <td key={weeks[index].weekStart}>{week.sets || '·'}</td>
                  ))}
                </tr>
                <tr className="block-load-tonnage">
                  <th scope="row">Tonelaje (kg)</th>
                  {load.weeks.map((week, index) => (
                    <td key={weeks[index].weekStart}>
                      {week.tonnage
                        ? String(Math.round(week.tonnage)).replace(/\B(?=(\d{3})+$)/g, '.')
                        : '·'}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </BlockFrame>
  );
}

function BlockFrame({ lead, children }: { lead: ReactNode; children: ReactNode }) {
  return (
    <section className="block-view" aria-label="Bloque">
      {lead}
      {children}
    </section>
  );
}
