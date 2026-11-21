import LandingNav from '../components/landing/LandingNav';
import LandingHero from '../components/landing/LandingHero';
import LandingShowcase, { LandingStatement } from '../components/landing/LandingShowcase';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingCoaches from '../components/landing/LandingCoaches';
import LandingFooter from '../components/landing/LandingFooter';
import '../components/landing/landing.css';

// Public page for signed-out visitors at /: what the app does, a playable demo and real screens. Signing in has its
// own page, /login, behind the header's "Iniciar sesión".
export default function LandingPage() {
  return (
    <div className="landing fam">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingStatement />
        <LandingFeatures />
        <section className="fam-container mt-20 lg:mt-28" aria-labelledby="screens-title">
          <h2 id="screens-title" className="fam-h2">
            Así se ve la app
          </h2>
          <LandingShowcase />
        </section>
        <LandingCoaches />
      </main>
      <LandingFooter />
    </div>
  );
}
