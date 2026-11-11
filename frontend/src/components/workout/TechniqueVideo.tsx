import type { WorkoutExercise } from '@/lib/workout/types';
import { useWorkoutStore } from '@/lib/workout/store';

const safeVideoUrl = (value?: string | null) => {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
};
export function TechniqueVideoLink({ exercise }: { exercise: WorkoutExercise }) {
  const url = safeVideoUrl(exercise.videoUrl);
  return url ? (
    <p className="my-2 text-sm">
      <a className="underline" href={url} target="_blank" rel="noreferrer">
        Ver vídeo técnico{exercise.videoSet ? ` · serie ${exercise.videoSet}` : ''}
        {exercise.videoSeconds != null ? ` · segundo ${exercise.videoSeconds}` : ''}
      </a>
    </p>
  ) : null;
}
export function TechniqueVideoEditor({ exercise }: { exercise: WorkoutExercise }) {
  const update = useWorkoutStore((state) => state.setExerciseVideo);
  const set = (patch: Partial<WorkoutExercise>) =>
    update(exercise.id, {
      videoUrl: exercise.videoUrl,
      videoSet: exercise.videoSet,
      videoSeconds: exercise.videoSeconds,
      ...patch,
    });
  return (
    <details className="px-4 py-2 text-sm">
      <summary className="cursor-pointer">Vídeo para revisar la técnica</summary>
      <p className="my-2">
        Añade un enlace HTTPS y da acceso a tu entrenador en el servicio donde esté guardado. El
        enlace se conserva con este ejercicio; puedes quitarlo al editar el entreno.
      </p>
      <label>
        Enlace del vídeo
        <input
          className="form-input w-full"
          type="url"
          maxLength={2048}
          value={exercise.videoUrl ?? ''}
          onChange={(event) => set({ videoUrl: event.target.value || null })}
          placeholder="https://…"
        />
      </label>
      {!!exercise.videoUrl && !safeVideoUrl(exercise.videoUrl) && (
        <p role="alert">Usa un enlace HTTPS válido, sin usuario ni contraseña.</p>
      )}
      <div className="flex gap-3 mt-2">
        <label>
          Serie
          <input
            className="form-input w-20"
            type="number"
            min={1}
            max={exercise.sets.length || 100}
            value={exercise.videoSet ?? ''}
            onChange={(event) =>
              set({ videoSet: event.target.value ? Number(event.target.value) : null })
            }
          />
        </label>
        <label>
          Segundo del vídeo
          <input
            className="form-input w-24"
            type="number"
            min={0}
            max={7200}
            value={exercise.videoSeconds ?? ''}
            onChange={(event) =>
              set({ videoSeconds: event.target.value ? Number(event.target.value) : null })
            }
          />
        </label>
      </div>
      <TechniqueVideoLink exercise={exercise} />
    </details>
  );
}
