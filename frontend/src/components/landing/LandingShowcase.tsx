import React from 'react';

const shots = [
  {
    src: '/landing/workout.webp',
    alt: 'Pestaña de entreno con el botón de empezar, la recuperación muscular y el calendario de actividad',
    tilt: '-rotate-6 lg:-translate-y-2',
  },
  {
    src: '/landing/nutrition.webp',
    alt: 'Diario de nutrición con calorías, macros y las comidas del día',
    tilt: 'rotate-0 z-10 lg:-translate-y-10',
  },
  {
    src: '/landing/tracking.webp',
    alt: 'Seguimiento semanal de peso, pasos y calorías',
    tilt: 'rotate-6 lg:-translate-y-2',
  },
];

// Real screens, fanned like the cards in the template. The statement under them is the one
// thing that sets the app apart, so it gets the display face at full width.
export default function LandingShowcase() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8" aria-labelledby="showcase-title">
      <ul className="-mx-6 flex items-end justify-center gap-0 overflow-x-clip py-8 sm:-mx-0 sm:gap-4 lg:gap-8">
        {shots.map((s) => (
          <li key={s.src} className={`landing-card w-[38%] max-w-[260px] shrink-0 p-2 ${s.tilt}`}>
            <img
              src={s.src}
              alt={s.alt}
              width="470"
              height="1024"
              loading="lazy"
              className="block w-full"
            />
          </li>
        ))}
      </ul>

      <h2
        id="showcase-title"
        className="landing-display mt-10 max-w-4xl text-[clamp(1.6rem,4.6vw,3rem)] font-bold leading-[1.1] text-white"
      >
        Cada ejercicio guarda su historial y sus récords por variante. Agarre, inclinación o
        máquina:{' '}
        <span className="text-[var(--landing-blue)]">nada se mezcla y nada se pierde.</span>
      </h2>
    </section>
  );
}
