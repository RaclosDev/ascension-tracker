import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { useConsents, useSaveConsents, type ConsentKind } from '../../lib/consents';
import { apiErrorMessage } from '../../lib/coach/api';
import { QueryErrorNotice } from '../QueryErrorNotice';

const OPTIONS: { kind: ConsentKind; title: string; detail: string }[] = [
  {
    kind: 'HEALTH_DATA',
    title: 'Datos de salud',
    detail:
      'Guardar peso, fotos de progreso, alimentación y seguimientos. Si lo retiras, no se guardan datos nuevos; lo ya guardado sigue visible y puedes borrarlo o borrar tu cuenta.',
  },
  {
    kind: 'AI_HEALTH',
    title: 'IA con tus comidas',
    detail: 'Enviar fotos y descripciones de tus comidas a Gemini para calcular sus nutrientes.',
  },
];

/** Lets the user give or withdraw the health and AI consents at any time (GDPR art. 7.3). */
export function SettingsConsentCard() {
  const consents = useConsents();
  const save = useSaveConsents();

  return (
    <div
      className="card mb-4"
      style={{ padding: 'var(--space-lg)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        <h2 className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Permisos de privacidad
        </h2>
      </div>
      {consents.isError && (
        <QueryErrorNotice retry={consents.refetch} pending={consents.isFetching} />
      )}
      {consents.data && (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Permisos de privacidad</legend>
          {OPTIONS.map(({ kind, title, detail }) => (
            <label key={kind} className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.data.consents[kind]?.granted === true}
                disabled={save.isPending}
                onChange={(e) =>
                  save.mutate([{ kind, granted: e.target.checked }], {
                    onSuccess: () => toast.success('Permiso actualizado'),
                    onError: (err) =>
                      toast.error(apiErrorMessage(err, 'No se pudo guardar el permiso')),
                  })
                }
              />
              <span>
                <span className="font-bold">{title}</span>
                <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {detail}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
