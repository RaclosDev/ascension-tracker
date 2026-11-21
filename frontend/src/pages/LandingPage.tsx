import LandingNav from '../components/landing/LandingNav';
import LandingHero from '../components/landing/LandingHero';
import { LandingStatement } from '../components/landing/LandingShowcase';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingCoaches from '../components/landing/LandingCoaches';
import LandingFooter from '../components/landing/LandingFooter';
import '../components/landing/landing.css';

// Public page for signed-out visitors at /: what the app does and real screens. Signing in has its
// own page, /login, behind the header's "Entrar".
export default function LandingPage() {
  return (
    <div className="landing">
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
