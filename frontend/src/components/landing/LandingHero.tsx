import { Link } from 'react-router-dom';
import { SIGN_UP } from './routes';
import LandingShowcase from './LandingShowcase';

// The poster at the top of the landing: what the app is and the way in on the left, the real
// screens on the right. The sign-in form lives on its own page (/login).
export default function LandingHero() {
  return (
    <section
      id="inicio"
      className="fam-container relative grid items-center gap-6 pb-12 pt-8 sm:pt-12 lg:grid-cols-12 lg:gap-8 lg:pb-20"
    >
      <div className="landing-rise lg:col-span-6">
        <h1 className="fam-h1">
          Tu progreso
          <br />
          bajo <span className="fam-mark">control</span>
        </h1>
        <p className="fam-lede">
          Récords por ejercicio y por variante, comidas registradas con una foto, peso y pasos cada
          día. Una PWA gratuita en español que funciona sin conexión y se instala en el móvil.
        </p>
        <div className="fam-cta-row">
          <Link to={SIGN_UP} className="fam-btn fam-btn--ink fam-btn--lg">
            Crear mi cuenta
          </Link>
          <a href="/demo" className="fam-btn fam-btn--lg">
            Probar la demo
          </a>
        </div>
      </div>
      <div className="landing-rise landing-rise-2 lg:col-span-6">
        <LandingShowcase />
      </div>
    </section>
  );
}
