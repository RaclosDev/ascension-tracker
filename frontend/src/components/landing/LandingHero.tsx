import { Link } from 'react-router-dom';
import { SIGN_UP } from './routes';
import { HeroDemo } from './LandingTryIt';

// The poster at the top of the landing: what the app is and the way in on the left, a playable demo
// on the right (same layout as the other landings of the family). Signing in has its own page.
export default function LandingHero() {
  return (
    <div className="fam-container">
      <section id="inicio" className="fam-hero">
        <div className="landing-rise">
          <h1 className="fam-h1">
            Entreno y dieta
            <br />
            en <span className="fam-mark">una app</span>
          </h1>
          <p className="fam-lede">
            Apunta cada serie viendo lo que levantaste la última vez, registra las comidas con una
            foto y sigue tu peso hasta el objetivo. Gratis, en español y también sin conexión.
          </p>
          <div className="fam-cta-row">
            <Link to={SIGN_UP} className="fam-btn fam-btn--ink fam-btn--lg">
              Crear mi cuenta
            </Link>
            <a href="/demo" className="fam-btn fam-btn--lg">
              Probar la demo
            </a>
          </div>
          <ul className="hero-points" aria-label="Qué puedes hacer">
            <li>Cada serie te muestra lo que levantaste la última vez y avisa si es récord.</li>
            <li>Haz una foto al plato y cuadra calorías y macros del día.</li>
            <li>Tu entrenador ve tus entrenos, te ajusta el plan y revisa tus check-ins.</li>
          </ul>
        </div>
        <div id="pruebalo" className="landing-rise landing-rise-2 fam-hero__demo">
          <HeroDemo />
        </div>
      </section>
    </div>
  );
}
