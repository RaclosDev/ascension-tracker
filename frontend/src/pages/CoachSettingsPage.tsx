import { Link, useSearchParams } from 'react-router-dom';
import { ProfessionalSettingsEditor } from '../components/coach/ProfessionalSettingsEditor';
import { CheckinTemplateEditor } from '../components/coach/CheckinTemplateEditor';
import { PushToggle } from '../components/coach/PushToggle';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import '../styles/coach-athlete.css';

const TABS = [
  ['perfil', 'Perfil'],
  ['incorporaciones', 'Incorporaciones'],
  ['pautar', 'Forma de pautar'],
  ['seguimiento', 'Preguntas del seguimiento'],
  ['avisos', 'Avisos'],
  ['cuenta', 'Cuenta'],
] as const;

/** The coach's own settings, one part at a time like the settings of an athlete. */
export default function CoachSettingsPage() {
  const [params] = useSearchParams();
  const tab = TABS.find(([id]) => id === params.get('apartado'))?.[0] ?? 'perfil';
  return (
    <CoachWorkspace>
      <CoachPageHeader
        title="Ajustes del entrenador"
        description="Cómo te presentas, cómo empiezan tus atletas y cómo pautas."
      />
      <div className="athlete-manage">
        <nav className="athlete-manage-tabs" aria-label="Apartados de los ajustes">
          {TABS.map(([id, label]) => (
            <Link
              key={id}
              to={`?apartado=${id}`}
              replace
              aria-current={id === tab ? 'page' : undefined}
              ref={
                id === tab
                  ? (node) => node?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="athlete-manage-panel">
          {(tab === 'perfil' || tab === 'incorporaciones' || tab === 'pautar') && (
            <ProfessionalSettingsEditor section={tab} />
          )}
          {tab === 'seguimiento' && <CheckinTemplateEditor />}
          {tab === 'avisos' && (
            <section className="card">
              <h2>Avisos de seguimiento</h2>
              <PushToggle
                text="Recibe un aviso en este dispositivo cuando un atleta envíe su seguimiento."
                unsupportedText="Este navegador no admite avisos. Puedes consultar los nuevos seguimientos en Seguimientos."
              />
            </section>
          )}
          {tab === 'cuenta' && (
            <section className="card">
              <h2>Cuenta y aplicación</h2>
              <div className="coach-settings-links">
                <Link to="/settings?section=theme">Apariencia</Link>
                <Link to="/settings?section=data">Datos y cuenta</Link>
                <Link to="/entrenador/plan">Suscripción a Ascension</Link>
                <Link to="/entrenador/guia">Guía interactiva</Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </CoachWorkspace>
  );
}
