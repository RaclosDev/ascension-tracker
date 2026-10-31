import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import LandingHero from '../components/landing/LandingHero';
import LandingShowcase from '../components/landing/LandingShowcase';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingFooter from '../components/landing/LandingFooter';
import '../components/landing/landing.css';

// Public page for signed-out visitors: what the app does, real screens, and the Google sign-in.
export default function LandingPage() {
  return (
    <div className="landing">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingShowcase />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </div>
  );
}
