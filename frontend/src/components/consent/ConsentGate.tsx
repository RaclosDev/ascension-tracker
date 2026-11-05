import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { needsConsentScreen, useConsents, useSaveConsents } from '../../lib/consents';
import { apiErrorMessage } from '../../lib/coach/api';
import { LEGAL_DOCS } from '../../lib/legal/docs';
import { PageLoader } from '../PageLoader';
import { QueryErrorNotice } from '../QueryErrorNotice';

/**
 * Blocks the app until the user accepts the current terms and privacy policy and answers the
 * health-data and AI questions. The legal pages stay reachable so they can be read first.
 */
export function ConsentGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isLegalPage = LEGAL_DOCS.some((doc) => pathname === `/${doc}`);
  const consents = useConsents(!isLegalPage);

  if (isLegalPage) return <>{children}</>;
  if (consents.isPending) return <PageLoader />;
  if (consents.isError) {
    return (
      <main className="p-6">
        <QueryErrorNotice retry={consents.refetch} pending={consents.isFetching} />
      </main>
    );
  }
  if (needsConsentScreen(consents.data)) {
    return <ConsentScreen updated={Object.keys(consents.data.consents).length > 0} />;
  }
  return <>{children}</>;
}

function ConsentScreen({ updated }: { updated: boolean }) {
  const save = useSaveConsents();
  const [terms, setTerms] = useState(false);
  const [health, setHealth] = useState(false);
  const [ai, setAi] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms) return;
    save.mutate(
      [
        { kind: 'TERMS', granted: true },
        { kind: 'PRIVACY', granted: true },
        { kind: 'HEALTH_DATA', granted: health },
        { kind: 'AI_HEALTH', granted: ai },
      ],
      {
        onError: (err) =>
          toast.error(apiErrorMessage(err, 'No se pudo guardar. Inténtalo de nuevo.')),
      },
    );
  };

  return (
    <main
      className="flex items-center justify-center p-4"
      style={{ minHeight: '100dvh', background: 'var(--bg-primary)' }}
    >
      <form
        onSubmit={submit}
        className="card flex flex-col gap-4"
        style={{ maxWidth: '34rem', width: '100%', padding: 'var(--space-lg)' }}
        aria-labelledby="consent-title"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h1 id="consent-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {updated ? 'Hemos actualizado los textos legales' : 'Antes de empezar'}
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Elige qué aceptas. Puedes cambiar los permisos de salud e IA cuando quieras en Ajustes
          &gt; Datos y cuenta.
        </p>

        <label className="flex gap-3 cursor-pointer">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            He leído y acepto los{' '}
            <a href="/terminos" target="_blank" rel="noopener noreferrer">
              términos de uso
            </a>{' '}
            y la{' '}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer">
              política de privacidad
            </a>
            . <strong>Obligatorio.</strong>
          </span>
        </label>

        <label className="flex gap-3 cursor-pointer">
          <input type="checkbox" checked={health} onChange={(e) => setHealth(e.target.checked)} />
          <span>
            Doy mi consentimiento explícito para que se guarden mis datos de salud (peso, fotos de
            progreso, alimentación y check-ins) y, si lo decido, se compartan con mi entrenador.
            <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sin este permiso puedes registrar entrenamientos y pasos, pero no esos datos.
            </span>
          </span>
        </label>

        <label className="flex gap-3 cursor-pointer">
          <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} />
          <span>
            Acepto que las fotos y descripciones de mis comidas se envíen a la IA de Google (Gemini)
            para calcular su valor nutricional.
            <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
              Opcional. Sin este permiso no se usa la IA.
            </span>
          </span>
        </label>

        <button type="submit" className="btn btn-primary" disabled={!terms || save.isPending}>
          {save.isPending ? 'Guardando…' : 'Continuar'}
        </button>
      </form>
    </main>
  );
}
