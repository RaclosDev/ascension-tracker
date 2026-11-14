import toast from 'react-hot-toast';
import { apiErrorMessage } from '@/lib/coach/api';
import { usePowerProfile, useSavePowerProfile } from '@/lib/coach/powerlifting';

export function PowerliftingToggle({ linkId, canEdit }: { linkId: string; canEdit: boolean }) {
  const profile = usePowerProfile(linkId);
  const save = useSavePowerProfile(linkId);
  return (
    <section className="card">
      <h2>Especialidad</h2>
      {profile.isPending ? (
        <p role="status">Cargando especialidad…</p>
      ) : profile.isError ? (
        <p role="alert">
          No se pudo cargar la especialidad.{' '}
          <button type="button" onClick={() => void profile.refetch()}>
            Reintentar
          </button>
        </p>
      ) : (
        <label className="flex gap-3 items-center mt-3">
          <input
            type="checkbox"
            checked={profile.data.profile.enabled}
            disabled={!canEdit || save.isPending}
            onChange={(e) =>
              save.mutate(
                {
                  ...profile.data,
                  profile: { ...profile.data.profile, enabled: e.target.checked },
                },
                {
                  onError: (error) =>
                    toast.error(apiErrorMessage(error, 'No se pudo guardar la especialidad')),
                },
              )
            }
          />
          Mostrar herramientas de powerlifting
        </label>
      )}
      <p className="coach-description">
        Activa marcas, referencias de entrenamiento y competiciones para este atleta. Al ocultarlas
        se conserva el historial.
      </p>
    </section>
  );
}
