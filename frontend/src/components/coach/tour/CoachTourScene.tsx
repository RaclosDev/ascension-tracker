import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PrescriptionSummary } from '../PrescriptionSummary';
import { demoPrescription, type CoachDemo } from './demo';
import { COACH_TOUR_STEPS, type CoachTourStepId } from './steps';

interface Props {
  step: CoachTourStepId;
  demo: CoachDemo;
  update: (patch: Partial<CoachDemo>) => void;
  act: () => void;
}

function Target({ children }: { children: ReactNode }) {
  return (
    <div className="coach-tour-target" data-tour-target>
      {children}
    </div>
  );
}

export function CoachTourScene({ step, demo, update, act }: Props) {
  const info = COACH_TOUR_STEPS.find((item) => item.id === step)!;
  const action = (
    <button className="btn btn-primary" onClick={act}>
      {info.action}
    </button>
  );
  const prescription = <PrescriptionSummary exercise={demoPrescription(demo)} />;
  switch (step) {
    case 'overview':
      return (
        <>
          <h2>Inicio · lo que necesita tu atención</h2>
          <div className="coach-tour-grid">
            <Target>
              <strong>1 check-in por responder</strong>
              <p>Lucía Vega · recibido hoy</p>
              {action}
            </Target>
            <div className="coach-tour-tile">
              <strong>1 semana por preparar</strong>
              <p>Mateo Gil · fuerza general</p>
            </div>
          </div>
          <p className="coach-description">La agenda semanal agrupa tus próximas revisiones.</p>
        </>
      );
    case 'invite':
      return (
        <>
          <h2>Alumnos · nueva incorporación</h2>
          <Target>
            <dl className="coach-tour-facts">
              <div>
                <dt>Nombre</dt>
                <dd>Mateo Gil</dd>
              </div>
              <div>
                <dt>Objetivo</dt>
                <dd>Fuerza general</dd>
              </div>
              <div>
                <dt>Disponibilidad</dt>
                <dd>3 días por semana</dd>
              </div>
              <div>
                <dt>Servicio</dt>
                <dd>Entrenamiento</dd>
              </div>
            </dl>
            {action}
          </Target>
          <p className="coach-description">
            El alumno acepta la invitación y decide qué datos comparte. Puedes preparar su perfil
            antes de que entre.
          </p>
        </>
      );
    case 'client':
      return (
        <>
          <h2>Alumnos</h2>
          <Target>
            <div className="coach-tour-person">
              <span className="coach-avatar" aria-hidden>
                LV
              </span>
              <div>
                <h3>Lucía Vega</h3>
                <p>Powerlifting · 3 días · check-in pendiente</p>
              </div>
            </div>
            {action}
          </Target>
          <div className="coach-tour-person coach-tour-tile">
            <span className="coach-avatar" aria-hidden>
              MG
            </span>
            <div>
              <h3>Mateo Gil</h3>
              <p>Fuerza general · 3 días · próxima semana sin plan</p>
            </div>
          </div>
        </>
      );
    case 'checkin':
      return (
        <>
          <h2>Lucía Vega · check-in semanal</h2>
          <div className="coach-tour-grid">
            <div className="coach-tour-tile">
              Energía <strong>2 / 5</strong>
            </div>
            <div className="coach-tour-tile">
              Sueño <strong>3 / 5</strong>
            </div>
            <div className="coach-tour-tile">
              Adherencia <strong>3 de 3 sesiones</strong>
            </div>
          </div>
          <blockquote>
            «He completado las sesiones, pero esta semana me he notado más cansada.»
          </blockquote>
          <Target>
            <label htmlFor="tour-reply">Tu respuesta</label>
            <textarea
              id="tour-reply"
              value={demo.reply}
              placeholder="Escribe una respuesta de prueba…"
              onChange={(e) => update({ reply: e.target.value })}
            />
            {action}
          </Target>
        </>
      );
    case 'history':
      return (
        <>
          <h2>Lucía Vega · última sesión</h2>
          <p>Lunes · sentadilla · 3 series de 5 a 80 kg · objetivo RPE 8</p>
          <Target>
            <div className="coach-tour-table-scroll">
              <table>
                <caption>Registro de la alumna</caption>
                <thead>
                  <tr>
                    <th>Serie</th>
                    <th>Carga</th>
                    <th>Reps</th>
                    <th>RPE</th>
                  </tr>
                </thead>
                <tbody>
                  {[8, 8, 9].map((rpe, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>80 kg</td>
                      <td>5</td>
                      <td>{rpe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {action}
          </Target>
          <blockquote>«La última serie me ha costado más de lo esperado.»</blockquote>
        </>
      );
    case 'copy':
      return (
        <>
          <h2>Lucía Vega · Semana</h2>
          <div className="coach-tour-grid">
            <div className="coach-tour-tile">
              <h3>Semana anterior</h3>
              <p>Lunes · sentadilla y accesorios</p>
              <p>Miércoles · banca y espalda</p>
              <p>Viernes · peso muerto y pierna</p>
              <p>3 de 3 sesiones registradas</p>
            </div>
            <Target>
              <h3>Próxima semana · borrador</h3>
              <p>
                {demo.copied
                  ? '3 días copiados y listos para editar.'
                  : 'Empieza con la estructura que ya conoces.'}
              </p>
              {action}
            </Target>
          </div>
        </>
      );
    case 'edit':
      return (
        <>
          <h2>Próxima semana · lunes</h2>
          <h3>Sentadilla</h3>
          <Target>
            <div className="coach-tour-grid">
              <label>
                Carga (kg)
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={demo.load}
                  onChange={(e) => update({ load: e.target.value, published: false })}
                />
              </label>
              <label>
                Repeticiones
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={demo.reps}
                  onChange={(e) => update({ reps: e.target.value, published: false })}
                />
              </label>
              <label>
                RPE
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={demo.rpe}
                  onChange={(e) => update({ rpe: e.target.value, published: false })}
                />
              </label>
            </div>
            <p className="coach-tour-preview">Vista previa: {prescription}</p>
            {action}
          </Target>
          <p className="coach-description">
            En el editor completo también puedes ajustar series, RIR, descanso, superseries y
            objetivos por serie.
          </p>
        </>
      );
    case 'library':
      return (
        <>
          <h2>Biblioteca · sesiones guardadas</h2>
          <Target>
            <span className="coach-eyebrow">Sesión favorita</span>
            <h3>Torso · 45 minutos</h3>
            <p>Press banca · remo · elevaciones laterales</p>
            <p>Una sesión reutilizable, independiente de tus programas.</p>
            {action}
          </Target>
          {demo.sessionAdded && (
            <p className="coach-tour-preview">
              Miércoles: Torso · 45 minutos. Ya puedes adaptar la sesión a Lucía.
            </p>
          )}
          <p className="coach-description">
            Guarda también programas completos y marca tus ejercicios habituales como favoritos.
          </p>
        </>
      );
    case 'notes':
      return (
        <>
          <h2>Próxima semana · intención y comentarios</h2>
          <p>Intención de ejemplo: descarga</p>
          <Target>
            <label htmlFor="tour-comment">Comentario para Lucía</label>
            <textarea
              id="tour-comment"
              value={demo.comment}
              onChange={(e) => update({ comment: e.target.value, published: false })}
            />
            <label htmlFor="tour-private">Nota privada del entrenador</label>
            <textarea
              id="tour-private"
              value={demo.privateNote}
              onChange={(e) => update({ privateNote: e.target.value })}
            />
            {action}
          </Target>
        </>
      );
    case 'publish':
      return (
        <>
          <h2>Próxima semana · {demo.published ? 'publicada en la demo' : 'borrador'}</h2>
          <Target>
            <div className="coach-inline-actions">
              <button
                className="btn btn-secondary"
                onClick={() =>
                  update({
                    feedback:
                      'Borrador guardado solo en la demo. Aún no cambia lo que ve la alumna.',
                  })
                }
              >
                Guardar borrador de ejemplo
              </button>
              {action}
            </div>
          </Target>
          <section className="coach-tour-preview" aria-label="Vista de Lucía">
            <h3>Así lo ve Lucía</h3>
            {demo.published ? (
              <>
                <p>Lunes · sentadilla</p>
                <p>{prescription}</p>
                {demo.sessionAdded && <p>Miércoles · Torso · 45 minutos</p>}
                <p>{demo.comment || 'Sin comentario de semana.'}</p>
              </>
            ) : (
              <p>El borrador todavía no aparece en su planificación.</p>
            )}
          </section>
          <p className="coach-description">
            Las notas privadas no aparecen en la vista de la alumna.
          </p>
        </>
      );
    case 'powerlifting':
      return (
        <>
          <h2>Lucía Vega · Powerlifting</h2>
          <Target>
            <dl className="coach-tour-facts">
              <div>
                <dt>Sentadilla</dt>
                <dd>110 kg</dd>
              </div>
              <div>
                <dt>Press banca</dt>
                <dd>65 kg</dd>
              </div>
              <div>
                <dt>Peso muerto</dt>
                <dd>140 kg</dd>
              </div>
            </dl>
            {action}
          </Target>
          <p className="coach-description">
            Estas referencias son ficticias. La especialidad se configura por alumno; Mateo puede
            seguir con entrenamiento general.
          </p>
        </>
      );
    case 'nutrition':
      return (
        <>
          <h2>Servicios · nutrición y progreso</h2>
          <Target>
            <h3>Pautas y recetas</h3>
            <p>
              Prepara opciones habituales y alternativas en tu biblioteca, y adapta la pauta a cada
              alumno.
            </p>
            {action}
          </Target>
          <div className="coach-tour-tile">
            <h3>Seguimiento corporal</h3>
            <p>
              Consulta las mediciones que el alumno decide compartir y revisa la tendencia junto con
              su feedback.
            </p>
          </div>
        </>
      );
    case 'settings':
      return (
        <>
          <h2>Ajustes del entrenador</h2>
          <Target>
            <label htmlFor="tour-question">Pregunta de tu plantilla de check-in</label>
            <input
              id="tour-question"
              value={demo.question}
              onChange={(e) => update({ question: e.target.value })}
            />
            {action}
          </Target>
          <div className="coach-tour-grid">
            <div className="coach-tour-tile">
              <h3>Perfil profesional</h3>
              <p>Presentación e incorporaciones.</p>
            </div>
            <div className="coach-tour-tile">
              <h3>Avisos</h3>
              <p>Notificaciones de nuevos check-ins.</p>
            </div>
          </div>
        </>
      );
    case 'finish':
      return (
        <>
          <h2>De la revisión a la próxima semana</h2>
          <ol className="coach-tour-checklist">
            <li>Revisa el check-in y las sesiones.</li>
            <li>Copia la semana o añade una sesión guardada.</li>
            <li>Ajusta cargas, esfuerzo y comentarios.</li>
            <li>Comprueba la vista del alumno y publica.</li>
          </ol>
          <Target>{action}</Target>
          <p className="coach-description">
            Cuando salgas de la demo, empieza por lo que necesites:
          </p>
          <div className="coach-inline-actions">
            <Link className="btn btn-secondary" to="/entrenador/alumnos">
              Ir a mis alumnos
            </Link>
            <Link className="btn btn-secondary" to="/entrenador/planificacion">
              Preparar mi biblioteca
            </Link>
            <Link className="btn btn-secondary" to="/entrenador/ajustes">
              Configurar mi perfil
            </Link>
          </div>
        </>
      );
  }
}
