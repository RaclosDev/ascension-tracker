import toast from 'react-hot-toast';
import { apiErrorMessage, useActivateCoach } from '../../lib/coach/api';

export function ActivateCoach() {
  const activate = useActivateCoach();
  return (
    <section className="card">
      <h2 className="card-title">Lleva a tus atletas desde Ascension</h2>
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
        Invita a tus atletas con un enlace. Cada atleta elige qué te comparte (cuerpo, entrenamiento
        o nutrición) y puede cambiarlo o terminar la relación cuando quiera. Esta cuenta pasa a ser
        solo de entrenador: para llevar tu propio seguimiento usa otra cuenta.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        disabled={activate.isPending}
        onClick={() =>
          activate.mutate(undefined, {
            onError: (e) =>
              toast.error(apiErrorMessage(e, 'No se pudo activar el modo entrenador')),
          })
        }
      >
        Activar modo entrenador
      </button>
    </section>
  );
}
