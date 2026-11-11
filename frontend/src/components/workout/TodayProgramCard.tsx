import { confirmAction } from '../../lib/confirmation';
import toast from 'react-hot-toast';
import { CalendarCheck, Check, Play } from 'lucide-react';
import { apiErrorMessage, formatCoachDate } from '@/lib/coach/api';
import { WEEKDAY_LABELS } from '@/lib/coach/weekdays';
import {
  prescriptionText,
  toPrescribedDay,
  useLeaveProgram,
  useTodayPlans,
  type TodayPlan,
} from '@/lib/coach/today';
import { useWorkoutStore } from '@/lib/workout/store';
import type { CompletedWorkout } from '@/lib/workout/types';

/** "Hoy": what each program a coach assigned prescribes for today, ready to start. */
export function TodayProgramCard({
  history,
  exerciseName,
}: {
  history: CompletedWorkout[];
  exerciseName: (id: string) => string;
}) {
  const plans = useTodayPlans();
  if (!plans.data?.length) return null;
  return (
    <section aria-label="Hoy" className="flex flex-col gap-3" style={{ marginBottom: '1.5rem' }}>
      {plans.data.map((plan) => (
        <PlanCard
          key={plan.assignmentId}
          plan={plan}
          history={history}
          exerciseName={exerciseName}
        />
      ))}
    </section>
  );
}

function PlanCard({
  plan,
  history,
  exerciseName,
}: {
  plan: TodayPlan;
  history: CompletedWorkout[];
  exerciseName: (id: string) => string;
}) {
  const startFromProgramDay = useWorkoutStore((s) => s.startFromProgramDay);
  const leave = useLeaveProgram();
  const byCoach = plan.coachName ? ` · de ${plan.coachName}` : '';

  const leaveButton = (label: string, confirmText: string) => (
    <button
      type="button"
      className="btn btn-secondary"
      disabled={leave.isPending}
      onClick={async () => {
        if (
          !(await confirmAction({
            title: 'Quitar programa',
            description: confirmText,
            confirmLabel: 'Quitar programa',
            destructive: true,
          }))
        )
          return;
        leave.mutate(plan.assignmentId, {
          onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo quitar el programa')),
        });
      }}
    >
      {label}
    </button>
  );

  return (
    <article className="card flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="text-xs font-semibold uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            Hoy · {plan.programName}
            {byCoach}
          </div>
          {plan.phase === 'ACTIVE' && plan.day && (
            <h2 className="text-lg font-bold text-white truncate">{plan.day.name}</h2>
          )}
        </div>
        {plan.phase === 'ACTIVE' && plan.week != null && plan.dayIndex != null && (
          <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
            Semana {plan.week} de {plan.weeks}, {WEEKDAY_LABELS[plan.dayIndex - 1].toLowerCase()}
          </span>
        )}
      </header>

      {plan.phase === 'UPCOMING' && (
        <p style={{ color: 'var(--text-secondary)' }}>
          Tu programa empieza el {formatCoachDate(plan.startDate)}.
        </p>
      )}

      {plan.phase === 'FINISHED' && (
        <div className="flex items-center justify-between gap-3">
          <p style={{ color: 'var(--text-secondary)' }}>Has completado todas las semanas.</p>
          {leaveButton(
            'Quitar',
            `¿Quitar «${plan.programName}» de Hoy? Seguirás teniéndolo guardado.`,
          )}
        </div>
      )}

      {plan.phase === 'ACTIVE' && !plan.day && (
        <p style={{ color: 'var(--text-secondary)' }}>Hoy es día de descanso.</p>
      )}

      {plan.phase === 'ACTIVE' && plan.day && (
        <>
          {plan.day.notes && <p className="text-sm text-white">{plan.day.notes}</p>}
          <ol className="flex flex-col gap-1">
            {plan.day.exercises.map((e, i) => {
              const target = prescriptionText(e);
              return (
                <li key={i} className="text-sm">
                  <span className="text-white font-semibold">
                    {e.exerciseName ?? exerciseName(e.exerciseId)}
                  </span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {e.sets} × {target || 'series'}
                  </span>
                </li>
              );
            })}
          </ol>
          {plan.completedWorkoutId ? (
            <p
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--success, #22c55e)' }}
            >
              <Check size={16} aria-hidden /> Ya has registrado el entreno de hoy.
            </p>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => startFromProgramDay(toPrescribedDay(plan.day!), history)}
            >
              <Play size={16} aria-hidden /> Empezar entreno pautado
            </button>
          )}
        </>
      )}

      {plan.phase === 'ACTIVE' && plan.otherDays.length > 0 && (
        <details>
          <summary className="text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            Hacer otro día de esta semana
          </summary>
          <ul className="flex flex-col gap-2 mt-2">
            {plan.otherDays.map((day) => {
              const label = `${day.name} (${WEEKDAY_LABELS[day.dayIndex - 1].toLowerCase()})`;
              return (
                <li key={day.id}>
                  <button
                    type="button"
                    className="btn btn-secondary w-full justify-start"
                    aria-label={`Empezar ${label}`}
                    onClick={() => startFromProgramDay(toPrescribedDay(day), history)}
                  >
                    <Play size={16} aria-hidden /> {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {plan.phase !== 'FINISHED' && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <CalendarCheck size={14} aria-hidden />
          <span>Si cambias ejercicios o series, quedará como «pautado modificado».</span>
        </div>
      )}
    </article>
  );
}
