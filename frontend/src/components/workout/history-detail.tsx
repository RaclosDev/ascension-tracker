import { useMemo } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { format } from 'date-fns';
import { Dumbbell, MessageSquareQuote, Repeat2, Trash2, X } from 'lucide-react';
import { TechniqueVideoLink } from './TechniqueVideo';
import { WorkoutExerciseVariant } from './WorkoutExerciseDetail';
import { buildWorkoutRecords, beatsWorkoutRecord, workoutVariantKey } from '@/utils/workoutRecords';
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  completedSets,
  formatDayLong,
  formatDuration,
  formatKg,
  sessionVolume,
} from '@/lib/workout/format';
import type { CompletedWorkout, Exercise, WorkoutExercise, WorkoutSet } from '@/lib/workout/types';
import { capitalizeFirst } from '@/utils/dateHelper';
import { useWorkoutComments } from '@/lib/coach/comments';
import { personName } from '@/lib/coach/api';
import '../../styles/workout-review.css';
import '../../styles/workout-history-detail.css';

type Props = {
  detail: CompletedWorkout | null;
  history: CompletedWorkout[];
  catalog: Map<string, Exercise>;
  showRpe: boolean;
  setDetailId: (id: string | null) => void;
  setDeletingId: (id: string) => void;
  startFromHistory: (workout: CompletedWorkout) => void;
};

const TAGS: Partial<Record<WorkoutSet['type'], { tag: string; label: string }>> = {
  warmup: { tag: 'C', label: 'calentamiento' },
  drop: { tag: 'D', label: 'descendente' },
  failure: { tag: 'F', label: 'al fallo' },
};

const kgNum = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** The heaviest completed set of an exercise, "100 kg × 7", or nothing for cardio and bodyweight. */
function topSet(ex: WorkoutExercise) {
  let best: WorkoutSet | null = null;
  for (const s of ex.sets) {
    if (!s.completed || s.type === 'warmup' || kgNum(s.weight) <= 0) continue;
    if (!best || kgNum(s.weight) > kgNum(best.weight)) best = s;
  }
  return best ? `${best.weight} kg × ${best.reps || '—'}` : null;
}

/** A finished session: the figures on top, each exercise as a card with its sets, actions at hand. */
export function WorkoutHistoryDetail({
  detail,
  history,
  catalog,
  showRpe,
  setDetailId,
  setDeletingId,
  startFromHistory,
}: Props) {
  const records = useMemo(
    () => (detail ? buildWorkoutRecords(history, detail.id) : new Map<string, number>()),
    [history, detail],
  );

  const prs = detail
    ? detail.exercises.reduce((n, ex) => {
        const best = records.get(workoutVariantKey(ex.exerciseId, ex.variant)) ?? 0;
        return n + (ex.sets.some((s) => s.completed && beatsWorkoutRecord(s.weight, best)) ? 1 : 0);
      }, 0)
    : 0;

  return (
    <Dialog open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
      {detail ? (
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content className="hd" aria-describedby={undefined}>
            <header className="hd-head">
              <DialogTitle className="hd-name">{detail.name}</DialogTitle>
              <p className="hd-date">
                {capitalizeFirst(formatDayLong(detail.finishedAt))} ·{' '}
                {format(detail.finishedAt, 'HH:mm')}
              </p>
            </header>
            <div className="hd-actions">
              <button
                type="button"
                className="btn btn-primary hd-repeat"
                onClick={() => startFromHistory(detail)}
              >
                <Repeat2 size={18} aria-hidden /> Repetir entrenamiento
              </button>
              <button
                type="button"
                className="btn btn-secondary hd-icon hd-delete"
                onClick={() => setDeletingId(detail.id)}
                aria-label="Borrar entrenamiento"
                title="Borrar entrenamiento"
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
            <DialogClose className="hd-icon hd-close" aria-label="Cerrar">
              <X size={20} aria-hidden />
            </DialogClose>

            <dl className="hd-stats">
              <div>
                <dt>Duración</dt>
                <dd>{formatDuration(detail.finishedAt - detail.startedAt)}</dd>
              </div>
              <div>
                <dt>Volumen</dt>
                <dd>{formatKg(sessionVolume(detail.exercises))}</dd>
              </div>
              <div>
                <dt>Series</dt>
                <dd>{completedSets(detail.exercises)}</dd>
              </div>
              <div>
                <dt>Ejercicios</dt>
                <dd>{detail.exercises.length}</dd>
              </div>
              {prs > 0 && (
                <div data-pr="">
                  <dt>Récords</dt>
                  <dd>{prs}</dd>
                </div>
              )}
            </dl>

            <div className="hd-body">
              {(detail.notes || null) && (
                <blockquote className="wr-quote">
                  <MessageSquareQuote size={16} aria-hidden />
                  <div>
                    <strong>Tu nota</strong>
                    <p>{detail.notes}</p>
                  </div>
                </blockquote>
              )}
              <CoachComments workoutId={detail.id} />

              <ol className="wr-list hd-list">
                {detail.exercises.map((ex, index) => (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex}
                    index={index}
                    meta={catalog.get(ex.exerciseId)}
                    best={records.get(workoutVariantKey(ex.exerciseId, ex.variant)) ?? 0}
                    showRpe={showRpe}
                  />
                ))}
              </ol>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      ) : null}
    </Dialog>
  );
}

function ExerciseCard({
  ex,
  index,
  meta,
  best,
  showRpe,
}: {
  ex: WorkoutExercise;
  index: number;
  meta?: Exercise;
  best: number;
  showRpe: boolean;
}) {
  const name = meta?.name ?? 'Ejercicio';
  const isCardio = meta?.muscle === 'cardio';
  const done = ex.sets.filter((s) => s.completed).length;
  const top = isCardio ? null : topSet(ex);
  const pr = ex.sets.some((s) => s.completed && beatsWorkoutRecord(s.weight, best));
  let work = 0;
  return (
    <li className="wr-card hd-card">
      <header className="wr-head">
        <span className="wr-media" aria-hidden="true">
          {meta?.gifUrl ? <img src={meta.gifUrl} alt="" loading="lazy" /> : <Dumbbell size={16} />}
        </span>
        <span className="wr-name">
          <strong>
            {index + 1}. {name}
          </strong>
          <small>
            {ex.supersetId && <span className="hd-tag">Superserie</span>}
            {done} de {ex.sets.length} series
            {top && <> · mejor {top}</>}
          </small>
        </span>
        {pr && <span className="hd-pr">Récord</span>}
      </header>
      <WorkoutExerciseVariant variant={ex.variant} />
      {ex.notes && <p className="wr-note">{ex.notes}</p>}
      <TechniqueVideoLink exercise={ex} />
      <table className="wr-sets hd-sets">
        <caption className="sr-only">Series de {name}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Serie</span>
            </th>
            <th scope="col">{isCardio ? 'Km' : 'Kg'}</th>
            <th scope="col">{isCardio ? 'Tiempo' : 'Reps'}</th>
            {showRpe && <th scope="col">Esfuerzo</th>}
            <th scope="col">
              <span className="sr-only">Récord</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ex.sets.map((s, i) => {
            const tag = TAGS[s.type];
            const number = tag ? tag.tag : ++work;
            const isPr = s.completed && beatsWorkoutRecord(s.weight, best);
            return (
              <tr key={s.id} data-skipped={s.completed ? undefined : ''}>
                <th scope="row">
                  <span className="wr-num" data-kind={s.type}>
                    {number}
                  </span>
                  <span className="sr-only">
                    Serie {i + 1}
                    {tag ? `, ${tag.label}` : ''}
                    {s.completed ? '' : ', sin completar'}
                  </span>
                </th>
                <td>{(isCardio ? s.distance : s.weight) || '—'}</td>
                <td>{(isCardio ? s.duration : s.reps) || '—'}</td>
                {showRpe && (
                  <td className="hd-effort">
                    {s.rir != null && s.rir !== '' ? `RIR ${s.rir}` : s.rpe ? `RPE ${s.rpe}` : '—'}
                  </td>
                )}
                <td className="hd-pr-cell">{isPr && <span className="hd-pr">PR</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </li>
  );
}

/** What the coach said about a workout done from their program. */
function CoachComments({ workoutId }: { workoutId: string }) {
  const comments = useWorkoutComments(workoutId);
  if (!comments.data?.length) return null;
  return (
    <>
      {comments.data.map((c) => (
        <blockquote key={c.coach.email} className="wr-quote">
          <MessageSquareQuote size={16} aria-hidden />
          <div>
            <strong>Comentario de {personName(c.coach)}</strong>
            <p>{c.text}</p>
          </div>
        </blockquote>
      ))}
    </>
  );
}
