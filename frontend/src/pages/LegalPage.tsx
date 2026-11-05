import { Link } from 'react-router-dom';
import { LEGAL_TEXTS, type LegalDoc } from '../lib/legal/texts';

const OTHERS: { doc: LegalDoc; label: string }[] = [
  { doc: 'privacidad', label: 'Privacidad' },
  { doc: 'terminos', label: 'Términos de uso' },
  { doc: 'terminos-entrenadores', label: 'Condiciones para entrenadores' },
];

/** A public legal text; readable signed in or out. */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  const text = LEGAL_TEXTS[doc];
  return (
    <div className="fade-in max-w-3xl mx-auto px-4 pt-2 pb-12 sm:pt-4">
      <header className="mb-6 pb-2 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">{text.title}</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Versión {text.version}
        </p>
      </header>
      <p role="note" className="card mb-6 text-sm">
        Borrador pendiente de revisión legal. Los datos entre corchetes se completarán antes de
        publicarlo de forma definitiva.
      </p>
      <div className="flex flex-col gap-6">
        {text.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-white mb-2">{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p
                key={p}
                className="mb-2 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <nav aria-label="Textos legales" className="mt-10 flex flex-wrap gap-4 text-sm">
        {OTHERS.filter((o) => o.doc !== doc).map((o) => (
          <Link key={o.doc} to={`/${o.doc}`} className="underline">
            {o.label}
          </Link>
        ))}
        <Link to="/" className="underline">
          Volver a Ascension
        </Link>
      </nav>
    </div>
  );
}
