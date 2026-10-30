import React from 'react';
import { Dumbbell, Camera, Scale, Download } from 'lucide-react';
import DripButton from './DripButton';

const groups = [
  {
    icon: Dumbbell,
    title: 'Entreno',
    text: 'Series de calentamiento, dropsets y al fallo. Plantillas, orden por arrastre y un mapa de calor de los músculos trabajados.',
    tags: ['Micro-variantes', 'Récords por ejercicio', 'Aviso push al acabar el descanso'],
  },
  {
    icon: Camera,
    title: 'Nutrición',
    text: 'Foto de la etiqueta o del plato y la IA rellena las calorías y los macros. Buscador que une OpenFoodFacts y FatSecret, y lector de código de barras.',
    tags: ['Gemini Vision', 'Código de barras', 'Macros diarios'],
  },
  {
    icon: Scale,
    title: 'Peso y pasos',
    text: 'Un registro al día. Media semanal, total perdido y la fecha estimada para llegar al objetivo al ritmo que lleves.',
    tags: ['Peso', 'Pasos', 'Fecha estimada'],
  },
  {
    icon: Download,
    title: 'Tus datos',
    text: 'Exporta todo a un JSON y restáuralo cuando quieras. Sin conexión sigues registrando: se sincroniza al volver.',
    tags: ['Exportar', 'Restaurar', 'Sin conexión'],
  },
];

export default function LandingFeatures() {
  return (
    <section
      id="funciones"
      className="mx-auto mt-20 grid max-w-6xl gap-10 px-5 sm:px-8 lg:mt-28 lg:grid-cols-12"
      aria-labelledby="features-title"
    >
      <div className="lg:col-span-4">
        <p className="landing-display text-[0.85rem] tracking-[0.12em] text-[var(--landing-blue)]">
          Qué incluye
        </p>
        <h2
          id="features-title"
          className="landing-display mt-3 text-[clamp(2.2rem,6vw,4rem)] font-bold text-white"
        >
          Todo lo que registras, en un sitio
        </h2>
        <p className="mt-4 max-w-[38ch] text-[var(--landing-muted)]">
          Sin anuncios, sin suscripción y sin cuenta nueva. Código abierto, en español.
        </p>
        <div className="mt-6" id="datos">
          <DripButton href="#entrar">Empezar ahora</DripButton>
        </div>
      </div>

      <ul className="grid gap-px border border-[var(--landing-steel)] bg-[var(--landing-steel)] sm:grid-cols-2 lg:col-span-8">
        {groups.map((g) => (
          <li key={g.title} className="bg-[var(--landing-bg)] p-6">
            <g.icon size={22} className="text-[var(--landing-blue)]" aria-hidden="true" />
            <h3 className="landing-display mt-4 text-[1.5rem] font-semibold text-white">
              {g.title}
            </h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--landing-muted)]">
              {g.text}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Puntos clave de ${g.title}`}>
              {g.tags.map((t) => (
                <li
                  key={t}
                  className="landing-display border border-[var(--landing-steel)] px-2 py-1 text-[0.7rem] tracking-[0.08em] text-[var(--landing-ink)]"
                >
                  {t}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
