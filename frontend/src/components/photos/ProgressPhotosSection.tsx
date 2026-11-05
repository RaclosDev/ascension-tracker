import { useRef, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import {
  compressPhoto,
  POSE_LABELS,
  POSES,
  useDeletePhoto,
  useMyPhotos,
  useUploadPhoto,
  type Pose,
} from '../../lib/progressPhotos';
import { PhotoGallery } from './PhotoGallery';

function errorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { error?: string; message?: string } } })?.response
    ?.data;
  return data?.error || data?.message || fallback;
}

/** The client's progress photos: take or pick one, it is shrunk on the phone and stored privately. */
export default function ProgressPhotosSection() {
  const photos = useMyPhotos();
  const upload = useUploadPhoto();
  const remove = useDeletePhoto();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [pose, setPose] = useState<Pose>('FRONT');
  const [takenOn, setTakenOn] = useState(today);
  const [preparing, setPreparing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPreparing(true);
    let blob: Blob;
    try {
      blob = await compressPhoto(file);
    } catch {
      toast.error('No se pudo leer la foto. Prueba con otra.');
      return;
    } finally {
      setPreparing(false);
      if (fileInput.current) fileInput.current.value = '';
    }
    upload.mutate(
      { blob, pose, takenOn },
      {
        onSuccess: () => toast.success('Foto guardada'),
        onError: (err) => toast.error(errorMessage(err, 'No se pudo subir la foto')),
      },
    );
  };

  const busy = preparing || upload.isPending;

  return (
    <section className="card mt-6 p-4" aria-labelledby="progress-photos-title">
      <h2 id="progress-photos-title" className="text-lg font-semibold flex items-center gap-2 mb-1">
        <Camera size={18} aria-hidden /> Fotos de progreso
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Solo las ves tú y, si se lo permites, tu entrenador.
      </p>

      {photos.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {photos.isError && <p role="alert">No se pudieron cargar las fotos.</p>}
      {photos.data && !photos.data.enabled && (
        <p style={{ color: 'var(--text-secondary)' }}>Las fotos aún no están disponibles.</p>
      )}

      {photos.data?.enabled && (
        <>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <fieldset className="flex gap-2 min-w-0">
              <legend className="sr-only">Pose</legend>
              {POSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn ${pose === p ? 'btn-primary' : 'btn-secondary'}`}
                  aria-pressed={pose === p}
                  onClick={() => setPose(p)}
                >
                  {POSE_LABELS[p]}
                </button>
              ))}
            </fieldset>
            <label className="flex flex-col text-sm" style={{ color: 'var(--text-secondary)' }}>
              Fecha
              <input
                type="date"
                className="rounded-lg px-3 py-2 bg-black/20 border"
                style={{ borderColor: 'var(--border-subtle)' }}
                max={today}
                value={takenOn}
                onChange={(e) => setTakenOn(e.target.value || today)}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? 'Subiendo…' : 'Añadir foto'}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Elegir foto de progreso"
              tabIndex={-1}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>

          {photos.data.photos.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              Aún no tienes fotos. Hazte una de frente, perfil y espalda con la misma luz cada pocas
              semanas para ver el cambio.
            </p>
          ) : (
            <PhotoGallery
              photos={photos.data.photos}
              deleting={remove.isPending}
              onDelete={(photo) => {
                if (!window.confirm('¿Borrar esta foto? No se puede deshacer.')) return;
                remove.mutate(photo.id, {
                  onSuccess: () => toast.success('Foto borrada'),
                  onError: (err) => toast.error(errorMessage(err, 'No se pudo borrar la foto')),
                });
              }}
            />
          )}
        </>
      )}
    </section>
  );
}
