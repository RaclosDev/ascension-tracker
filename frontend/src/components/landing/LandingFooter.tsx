import React from 'react';

export default function LandingFooter() {
  return (
    <footer className="mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[var(--landing-steel)] px-5 py-8 text-[0.85rem] text-[var(--landing-muted)] sm:px-8">
      <img
        src="/ascension-title.png"
        alt="Ascension"
        className="h-6 w-auto"
        width="120"
        height="24"
      />
      <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>Código abierto, licencia MIT.</span>
        <a
          href="https://github.com/RaclosDev/ascension-tracker"
          className="flex min-h-11 items-center underline-offset-4 hover:text-white hover:underline focus-visible:text-white"
        >
          Ver el código en GitHub
        </a>
      </p>
    </footer>
  );
}
