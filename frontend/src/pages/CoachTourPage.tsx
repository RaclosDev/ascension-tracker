import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import { COACH_TOUR_STEPS } from '../components/coach/tour/steps';
import { readTourProgress, saveTourProgress } from '../components/coach/tour/progress';
import '../styles/coach-tour.css';

export default function CoachTourPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const progress = user ? readTourProgress(user.email) : null;
  const start = (step: number) => {
    if (!user) return;
    saveTourProgress(user.email, { status: 'started', step });
    navigate('/entrenador/guia/recorrido');
  };
  const chapters = COACH_TOUR_STEPS.filter(
    (step, index, all) => index === 0 || all[index - 1].chapter !== step.chapter,
  );
  return (
    <CoachWorkspace>
      <CoachPageHeader
        title="Tour del entrenador"
        description="Recorre las pantallas de la aplicación. Te iremos señalando dónde clicar y para qué sirve cada herramienta."
      />
      <section className="card coach-tour-intro">
        <h2>Del feedback a la siguiente semana</h2>
        <p>
          Abre Alumnos, entra en el perfil de Lucía y aprende a revisar su semana, copiar
          entrenamientos, ajustar la pauta y comprobar cómo la verá.
        </p>
        <p>
          El recorrido usa datos de ejemplo. Puedes seguirlo aunque todavía no tengas alumnos, salir
          en cualquier momento y retomarlo después.
        </p>
        <div className="coach-tour-actions">
          {progress?.status === 'started' && progress.step > 0 && (
            <button className="btn btn-primary" onClick={() => start(progress.step)}>
              Continuar tour · paso {progress.step + 1}
            </button>
          )}
          <button
            className={`btn ${progress?.status === 'started' && progress.step > 0 ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => start(0)}
          >
            {progress ? <RotateCcw size={18} aria-hidden /> : <Play size={18} aria-hidden />}
            {progress ? 'Repetir tour desde el principio' : 'Empezar tour'}
          </button>
        </div>
      </section>
      <section aria-labelledby="tour-chapters">
        <h2 id="tour-chapters">Ir directamente a una parte</h2>
        <div className="coach-tour-chapters">
          {chapters.map((step) => (
            <button
              className="card"
              key={step.id}
              onClick={() => start(COACH_TOUR_STEPS.indexOf(step))}
            >
              <strong>{step.chapter}</strong>
              <span>{step.title}</span>
            </button>
          ))}
        </div>
      </section>
    </CoachWorkspace>
  );
}
