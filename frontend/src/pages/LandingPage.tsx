import LandingNav from '../components/landing/LandingNav';
import LandingHero from '../components/landing/LandingHero';
import LandingStatement from '../components/landing/LandingStatement';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingCoaches from '../components/landing/LandingCoaches';
import LandingFooter from '../components/landing/LandingFooter';
import '../components/landing/landing.css';

// Public page for signed-out visitors at /: what the app does, a playable demo and the real app in a phone. Signing in has its
// own page, /login, behind the header's "Iniciar sesión".
export default function LandingPage() {
  return (
    <div className="landing fam">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingStatement />
        <LandingFeatures />
        <LandingCoaches />
      </main>
      <LandingFooter />
    </div>
  );
}
