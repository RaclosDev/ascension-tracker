// The one thing that sets the app apart, in the display face at full width under the hero.
export default function LandingStatement() {
  return (
    <section className="fam-container" aria-labelledby="statement-title">
      <h2 id="statement-title" className="landing-statement max-w-4xl">
        Cada variante de un ejercicio lleva su propio historial y sus récords. Agarre, inclinación
        o máquina:{' '}
        <span className="text-[var(--landing-blue)]">sabes si de verdad estás progresando.</span>
      </h2>
    </section>
  );
}
