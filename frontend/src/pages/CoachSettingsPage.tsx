import { Link } from 'react-router-dom';
import { ProfessionalSettingsEditor } from '../components/coach/ProfessionalSettingsEditor';
import { CheckinTemplateEditor } from '../components/coach/CheckinTemplateEditor';
import { PushToggle } from '../components/coach/PushToggle';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';

export default function CoachSettingsPage() {
  return (
    <CoachWorkspace>
      <CoachPageHeader
        title="Ajustes del entrenador"
        description="Tu identidad profesional, los valores iniciales de las incorporaciones y los avisos."
      >
        <Link className="btn btn-secondary" to="/entrenador/guia">
          Guía interactiva
        </Link>
      </CoachPageHeader>
      <ProfessionalSettingsEditor />
      <div className="coach-settings-grid">
        <CheckinTemplateEditor />
        <div className="flex flex-col gap-5">
          <section className="card">
            <h2>Avisos de seguimiento</h2>
            <PushToggle
              text="Recibe un aviso en este dispositivo cuando un atleta envíe su seguimiento."
              unsupportedText="Este navegador no admite avisos. Puedes consultar los nuevos seguimientos en Seguimientos."
            />
          </section>
          <section className="card">
            <h2>Cuenta y aplicación</h2>
            <div className="coach-settings-links">
              <Link to="/settings?section=theme">Apariencia</Link>
              <Link to="/settings?section=data">Datos y cuenta</Link>
              <Link to="/entrenador/plan">Suscripción a Ascension</Link>
            </div>
          </section>
        </div>
      </div>
    </CoachWorkspace>
  );
}
