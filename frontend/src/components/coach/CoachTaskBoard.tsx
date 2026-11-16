import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { personName } from '../../lib/coach/api';
import { clientHref, type CoachRow } from '../../lib/coach/workspace';
import { clientTasks } from '../../lib/coach/tasks';

export function CoachTaskBoard({ rows }: { rows: CoachRow[] }) {
  const tasks = rows.flatMap((row) => clientTasks(row).map((task) => ({ link: row.link, task })));
  return (
    <div className="coach-dashboard-grid">
      {(['coach', 'client'] as const).map((owner) => {
        const visible = tasks.filter((item) => item.task.owner === owner);
        return (
          <section
            key={owner}
            className="card coach-worklist"
            aria-label={owner === 'coach' ? 'Pendiente de ti' : 'Pendiente del atleta'}
          >
            <div className="coach-section-heading">
              <h2>{owner === 'coach' ? 'Pendiente de ti' : 'Pendiente del atleta'}</h2>
              <span>
                {visible.length} {visible.length === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>
            {visible.length === 0 ? (
              <div className="coach-empty-inline">
                <h3>
                  {owner === 'coach'
                    ? 'No tienes tareas pendientes'
                    : 'Sin acciones pendientes del atleta'}
                </h3>
                <p>El seguimiento se actualiza al guardar cambios y recibir nuevos seguimientos.</p>
              </div>
            ) : (
              <ul className="coach-action-list">
                {visible.slice(0, 8).map(({ link, task }) => (
                  <li key={`${link.linkId}:${task.id}`}>
                    <Link to={clientHref(link.linkId, task.section)}>
                      <span>
                        <strong>{personName(link.client)}</strong>
                        <span className="block">{task.title}</span>
                        <small>{task.detail}</small>
                      </span>
                      <ArrowUpRight size={18} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {visible.length > 8 && (
              <p className="mt-4">
                <Link to={`/entrenador/atletas?filtro=${owner === 'coach' ? 'tasks' : 'waiting'}`}>
                  Ver las {visible.length} tareas en atletas
                </Link>
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
