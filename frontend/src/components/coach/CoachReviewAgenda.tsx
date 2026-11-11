import { Link } from 'react-router-dom';
import { personName } from '../../lib/coach/api';
import { nextReviewLabel, REVIEW_DAYS } from '../../lib/coach/coachSchedule';
import { clientHref, searchName, type CoachRow } from '../../lib/coach/workspace';

export function CoachReviewAgenda({ rows, search }: { rows: CoachRow[]; search: string }) {
  const active = rows.filter(
    ({ link }) => link.setup?.reviewed && link.followup && !link.followup.schedule.paused,
  );
  const visible = active.filter(({ link }) =>
    searchName(personName(link.client)).includes(searchName(search.trim())),
  );
  return (
    <section aria-label="Agenda semanal" className="flex flex-col gap-4">
      <p className="coach-description">
        Horario semanal de envío del check-in. Cada hora se muestra en la zona acordada con ese
        alumno. La próxima fecha incluye el margen de incorporación o reanudación.
      </p>
      {visible.length === 0 && (
        <div className="card coach-empty-inline">
          <h2>{search ? 'No hay coincidencias' : 'Sin revisiones programadas'}</h2>
          <p>Configura el servicio y la agenda desde Gestión en la ficha del alumno.</p>
          <Link to="/entrenador/alumnos">Ver alumnos</Link>
        </div>
      )}
      {REVIEW_DAYS.map((day, index) => {
        const entries = visible
          .filter(({ link }) => link.followup?.schedule.day === index + 1)
          .sort((a, b) =>
            (a.link.followup?.schedule.time ?? '').localeCompare(
              b.link.followup?.schedule.time ?? '',
            ),
          );
        if (!entries.length) return null;
        return (
          <section className="card" key={day}>
            <h2>
              {day} <span className="coach-chip-count">{entries.length}</span>
            </h2>
            <ul className="coach-action-list">
              {entries.map(({ link }) => {
                const followup = link.followup;
                if (!followup) return null;
                return (
                  <li key={link.linkId}>
                    <Link
                      to={`${clientHref(link.linkId, 'revisiones')}&origen=revisiones&lista=vista%3Dagenda`}
                    >
                      <span>
                        <strong>{personName(link.client)}</strong>
                        <small>
                          {followup.schedule.time.slice(0, 5)} · {followup.schedule.timeZone}
                        </small>
                        <small>Próxima: {nextReviewLabel(followup)}</small>
                      </span>
                      <span className="coach-row-action">Abrir revisión</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
