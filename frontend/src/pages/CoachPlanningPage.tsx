import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, ChefHat, Utensils } from 'lucide-react';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';

export default function CoachPlanningPage() {
  return (
    <CoachWorkspace>
      <CoachPageHeader
        title="Planificación"
        description="Prepara recursos reutilizables y adapta el trabajo desde la ficha de cada alumno."
      />
      <div className="coach-resource-grid">
        <section className="card">
          <Utensils size={24} aria-hidden />
          <h2>Pautas de nutrición</h2>
          <p>
            Prepara objetivos y comidas para entreno y descanso. Copia cada pauta y adáptala al
            alumno antes de publicarla.
          </p>
          <Link className="btn btn-secondary" to="/entrenador/pautas">
            Abrir pautas <ArrowUpRight size={16} aria-hidden />
          </Link>
        </section>
        <section className="card">
          <ClipboardList size={24} aria-hidden />
          <h2>Programas de entrenamiento</h2>
          <p>
            Organiza semanas, sesiones y ejercicios. Cada asignación crea una copia para el alumno.
          </p>
          <Link className="btn btn-primary" to="/entrenador/programas">
            Abrir programas <ArrowUpRight size={16} aria-hidden />
          </Link>
        </section>
        <section className="card">
          <ChefHat size={24} aria-hidden />
          <h2>Recetas</h2>
          <p>
            Guarda recetas con sus ingredientes y raciones para preparar tus pautas nutricionales.
          </p>
          <Link className="btn btn-secondary" to="/entrenador/recetas">
            Abrir recetas <ArrowUpRight size={16} aria-hidden />
          </Link>
        </section>
      </div>
      <section className="coach-note">
        <h2>La planificación de cada alumno, en su ficha</h2>
        <p>
          En Entrenamiento puedes asignar un programa. En Nutrición puedes ajustar su pauta si te ha
          dado permiso.
        </p>
        <Link to="/entrenador/alumnos">
          Elegir alumno <ArrowUpRight size={14} aria-hidden />
        </Link>
      </section>
    </CoachWorkspace>
  );
}
