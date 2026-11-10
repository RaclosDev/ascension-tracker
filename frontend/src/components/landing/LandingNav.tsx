import InkButton from './InkButton';
import Wordmark from './Wordmark';
import { requestEmailAccess } from './emailAccessEvents';

const links = [
  { href: '#funciones', label: 'Funciones' },
  { href: '#datos', label: 'Tus datos' },
  { href: '#entrenadores', label: 'Entrenadores' },
];

export default function LandingNav() {
  return (
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <a href="#inicio" className="flex min-h-11 items-center" aria-label="Ascension, inicio">
        <Wordmark className="text-[1.6rem] sm:text-[1.85rem]" />
      </a>
      <nav aria-label="Secciones" className="hidden items-center gap-2 md:flex">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="landing-display flex min-h-11 items-center px-3 text-[1.05rem] tracking-[0.06em] text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-blue)] focus-visible:text-[var(--landing-blue)]"
          >
            {l.label}
          </a>
        ))}
      </nav>
      <InkButton href="#entrar" onClick={requestEmailAccess('login')}>
        Entrar
      </InkButton>
    </header>
  );
}
