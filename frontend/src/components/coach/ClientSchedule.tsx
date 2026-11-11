import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage, type CoachClient } from '../../lib/coach/api';
import {
  defaultSchedule,
  nextReviewLabel,
  REVIEW_DAYS,
  useSaveSchedule,
} from '../../lib/coach/coachSchedule';

export function ClientSchedule({ link }: { link: CoachClient }) {
  const save = useSaveSchedule(link.linkId);
  const [schedule, setSchedule] = useState(() => link.followup?.schedule ?? defaultSchedule());
  const current = link.followup?.schedule ?? defaultSchedule();
  const dirty =
    schedule.day !== current.day ||
    schedule.time.slice(0, 5) !== current.time.slice(0, 5) ||
    schedule.timeZone !== current.timeZone ||
    schedule.paused !== current.paused;
  return (
    <form
      className="card flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(schedule, {
          onSuccess: () => toast.success('Agenda guardada'),
          onError: (error) => toast.error(apiErrorMessage(error, 'No se pudo guardar la agenda')),
        });
      }}
    >
      <div>
        <h2>Agenda de revisiones</h2>
        <p className="coach-description">
          Acuerda con el alumno cuándo debe enviar su check-in semanal. Recibirá un recordatorio si
          aún no lo ha enviado y tiene los avisos activados.
        </p>
      </div>
      <fieldset disabled={save.isPending} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Horario de revisión</legend>
        <label className="coach-schedule-field flex flex-col gap-2 min-w-0">
          <span>Día de revisión</span>
          <select
            value={schedule.day}
            onChange={(e) => setSchedule({ ...schedule, day: Number(e.target.value) })}
          >
            {REVIEW_DAYS.map((day, index) => (
              <option key={day} value={index + 1}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <label className="coach-schedule-field flex flex-col gap-2 min-w-0">
          <span>Hora de revisión</span>
          <input
            type="time"
            required
            value={schedule.time.slice(0, 5)}
            onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
          />
        </label>
        <label className="coach-schedule-field flex flex-col gap-2 min-w-0 sm:col-span-2">
          <span>Zona horaria</span>
          <input
            required
            list="review-time-zones"
            maxLength={80}
            placeholder="Europe/Madrid"
            value={schedule.timeZone}
            onChange={(e) => setSchedule({ ...schedule, timeZone: e.target.value })}
          />
          <datalist id="review-time-zones">
            {[
              'Europe/Madrid',
              'Atlantic/Canary',
              'Europe/London',
              'America/Mexico_City',
              'America/Bogota',
              'America/Argentina/Buenos_Aires',
              'America/Santiago',
              'UTC',
            ].map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </label>
        <label className="flex items-center gap-2 min-h-11 sm:col-span-2">
          <input
            type="checkbox"
            checked={schedule.paused}
            onChange={(e) => setSchedule({ ...schedule, paused: e.target.checked })}
          />
          Pausar seguimiento
        </label>
      </fieldset>
      <p className="coach-description">
        La pausa detiene recordatorios y alertas de seguimiento. Conserva el historial y los
        permisos; el alumno sigue ocupando una plaza. Al reanudar o cambiar el horario, dispone de
        al menos siete días para la siguiente revisión.
      </p>
      {link.followup && (
        <p className="text-sm">
          {link.followup.schedule.paused
            ? 'Seguimiento en pausa'
            : `Próxima fecha: ${nextReviewLabel(link.followup)}`}
        </p>
      )}
      {!link.setup?.reviewed && (
        <p className="text-sm">
          Las revisiones automáticas empezarán cuando confirmes la incorporación.
        </p>
      )}
      <button
        type="submit"
        className="btn btn-primary self-start"
        disabled={!dirty || save.isPending}
      >
        {save.isPending ? 'Guardando…' : 'Guardar agenda'}
      </button>
    </form>
  );
}
