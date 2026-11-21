const shots = [
  {
    src: '/landing/workout',
    alt: 'Entrenamiento en curso: series de press de banca con kilos y repeticiones, dos completadas, y el temporizador de descanso',
    tilt: '-rotate-6 translate-y-8',
  },
  {
    src: '/landing/dashboard',
    alt: 'Panel principal de Ascension con el peso de hoy, el total perdido y la fecha estimada para llegar al objetivo',
    tilt: 'z-10 scale-[1.08]',
  },
  {
    src: '/landing/nutrition',
    alt: 'Diario de nutrición con calorías, macros y las comidas del día',
    tilt: 'rotate-6 translate-y-8',
  },
];

// Real screens, each in a phone body and fanned with the middle one forward, next to the headline
// so the first screen already shows the app. Nothing clips them: the tilted corners show whole.
export default function LandingShowcase() {
  return (
    <ul
      aria-label="Pantallas de la app"
      className="flex items-start justify-center px-2 pt-4 pb-14 sm:gap-2 lg:gap-0 xl:gap-2"
    >
      {shots.map((s, i) => (
        <li
          key={s.src}
          className={`landing-phone w-[34%] max-w-[260px] shrink-0 ${i === 1 ? '' : 'lg:-mx-3 xl:mx-0'} ${s.tilt}`}
        >
          <img
            src={`${s.src}.webp`}
            srcSet={`${s.src}-520.webp 520w, ${s.src}.webp 860w`}
            sizes="(min-width: 1024px) 260px, 34vw"
            alt={s.alt}
            width="860"
            height="1864"
            fetchPriority={i === 1 ? 'high' : 'auto'}
            className="block w-full"
          />
        </li>
      ))}
    </ul>
  );
}

// The one thing that sets the app apart, in the display face at full width under the hero.
export function LandingStatement() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8" aria-labelledby="statement-title">
      <h2
        id="statement-title"
        className="landing-display max-w-4xl text-[clamp(1.6rem,4.6vw,3rem)] font-bold leading-[1.1] text-balance text-white"
      >
        Cada ejercicio guarda su historial y sus récords por variante. Agarre, inclinación o
        máquina:{' '}
        <span className="text-[var(--landing-blue)]">nada se mezcla y nada se pierde.</span>
      </h2>
    </section>
  );
}
