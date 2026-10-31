import React from 'react';
import DripButton from './DripButton';

const links = [
  { href: '#funciones', label: 'Funciones' },
  { href: '#datos', label: 'Tus datos' },
  { href: '#entrar', label: 'Entrar' },
];

export default function LandingNav() {
  return (
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <a href="#inicio" className="flex min-h-11 items-center" aria-label="Ascension, inicio">
        <img
          src="/ascension-title.png"
          alt=""
          className="h-7 w-auto sm:h-8"
          width="160"
          height="32"
        />
      </a>
      <nav aria-label="Secciones" className="hidden items-center gap-1 sm:flex">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="landing-display flex min-h-11 items-center px-3 text-[0.8rem] tracking-[0.08em] text-[var(--landing-muted)] transition-colors hover:text-white focus-visible:text-white"
          >
            {l.label}
          </a>
        ))}
      </nav>
      <DripButton href="#entrar">Entrar</DripButton>
    </header>
  );
}
