import { useState } from 'react';
import toast from 'react-hot-toast';
import { CATEGORIES, useSaveLibraryItem, type LibraryItem } from '@/lib/coach/library';
import { apiErrorMessage } from '@/lib/coach/api';

/** How a library resource is filed: its type, tags, equipment and length. */
export function LibraryItemFields({ item, onDone }: { item: LibraryItem; onDone: () => void }) {
  const [value, setValue] = useState(item);
  const save = useSaveLibraryItem();
  return (
    <form
      className="coach-library-fields"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { ...value, tags: value.tags.map((t) => t.trim()).filter(Boolean) },
          {
            onSuccess: () => {
              toast.success('Clasificación guardada');
              onDone();
            },
            onError: (error) =>
              toast.error(apiErrorMessage(error, 'No se pudo guardar la clasificación')),
          },
        );
      }}
    >
      <label>
        Tipo
        <select
          className="form-input"
          value={value.category}
          onChange={(e) =>
            setValue({ ...value, category: e.target.value as LibraryItem['category'] })
          }
        >
          {Object.entries(CATEGORIES)
            .filter(([id]) => id !== 'EXERCISE')
            .map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
        </select>
      </label>
      <label>
        Etiquetas (separadas por comas)
        <input
          className="form-input"
          maxLength={491}
          value={value.tags.join(',')}
          onChange={(e) => setValue({ ...value, tags: e.target.value.split(',').slice(0, 12) })}
        />
      </label>
      <label>
        Material
        <input
          className="form-input"
          maxLength={120}
          value={value.equipment}
          onChange={(e) => setValue({ ...value, equipment: e.target.value })}
        />
      </label>
      <label>
        Duración (min)
        <input
          className="form-input"
          type="number"
          min={1}
          max={300}
          value={value.minutes ?? ''}
          onChange={(e) =>
            setValue({ ...value, minutes: e.target.value ? Number(e.target.value) : null })
          }
        />
      </label>
      <div>
        <button type="submit" className="btn btn-primary" disabled={save.isPending}>
          Guardar
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
