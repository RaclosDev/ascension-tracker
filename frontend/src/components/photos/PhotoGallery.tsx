import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { groupByDay, POSE_LABELS, type ProgressPhoto } from '../../lib/progressPhotos';

const dayLabel = (iso: string) => format(parseISO(iso), "d 'de' MMMM yyyy", { locale: es });

/** Progress photos by day, newest first. Tapping a photo opens it full size. */
export function PhotoGallery({
  photos,
  onDelete,
  deleting,
}: {
  photos: ProgressPhoto[];
  onDelete?: (photo: ProgressPhoto) => void;
  deleting?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {groupByDay(photos).map((day) => (
        <section key={day.takenOn} aria-label={dayLabel(day.takenOn)}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            {dayLabel(day.takenOn)}
          </h3>
          <ul className="grid grid-cols-3 gap-2">
            {day.photos.map((photo) => {
              const label = `${POSE_LABELS[photo.pose]}, ${dayLabel(photo.takenOn)}`;
              return (
                <li key={photo.id} className="relative min-w-0">
                  <a href={photo.url} target="_blank" rel="noreferrer noopener" className="block">
                    <img
                      src={photo.url}
                      alt={label}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[3/4] object-cover rounded-lg bg-black/20"
                    />
                  </a>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {POSE_LABELS[photo.pose]}
                  </span>
                  {onDelete && (
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded-full p-2 bg-black/60 text-white"
                      aria-label={`Borrar foto: ${label}`}
                      disabled={deleting}
                      onClick={() => onDelete(photo)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
