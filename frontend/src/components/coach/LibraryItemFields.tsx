import { useState } from 'react';
import toast from 'react-hot-toast';
import { CATEGORIES, useSaveLibraryItem, type LibraryItem } from '@/lib/coach/library';
import { apiErrorMessage } from '@/lib/coach/api';

export function LibraryItemFields({ item }: { item: LibraryItem }) {
  const [value, setValue] = useState(item);
  const save = useSaveLibraryItem();
  return (
    <details className="w-full">
      <summary className="cursor-pointer text-sm">Tipo, etiquetas, material y duración</summary>
      <div className="flex flex-wrap gap-3 mt-3">
        <label>
          Tipo
          <select
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
            maxLength={491}
            value={value.tags.join(',')}
            onChange={(e) => setValue({ ...value, tags: e.target.value.split(',').slice(0, 12) })}
          />
        </label>
        <label>
          Material
          <input
            maxLength={120}
            value={value.equipment}
            onChange={(e) => setValue({ ...value, equipment: e.target.value })}
          />
        </label>
        <label>
          Duración (min)
          <input
            type="number"
            min={1}
            max={300}
            value={value.minutes ?? ''}
            onChange={(e) =>
              setValue({ ...value, minutes: e.target.value ? Number(e.target.value) : null })
            }
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={save.isPending}
          onClick={() =>
            save.mutate(
              { ...value, tags: value.tags.map((t) => t.trim()).filter(Boolean) },
              {
                onSuccess: () => toast.success('Etiquetas guardadas'),
                onError: (error) =>
                  toast.error(apiErrorMessage(error, 'No se pudieron guardar las etiquetas')),
              },
            )
          }
        >
          Guardar etiquetas
        </button>
      </div>
    </details>
  );
}
