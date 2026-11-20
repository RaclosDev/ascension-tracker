import { useState } from 'react';
import { Apple, Footprints, Scale } from 'lucide-react';
import { type CoachClient } from '../../lib/coach/api';
import { CoachTracking } from './CoachTracking';

type Metric = 'peso' | 'pasos' | 'kcal';
const STORAGE_KEY = 'ascension.coach.trackingMetrics';
const METRICS = [
  { id: 'peso', label: 'Peso', icon: Scale },
  { id: 'pasos', label: 'Pasos', icon: Footprints },
  { id: 'kcal', label: 'Kcal', icon: Apple },
] as const;

function readHidden(): Metric[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const stepsShared = (link: CoachClient) =>
  link.permissions.body && link.setup?.services?.progress !== false;

/** Progreso: the athlete's weekly tracking as they see it, a card per week with weight, steps and calories. */
export default function ClientProgress({
  link,
  recordHref,
}: {
  link: CoachClient;
  recordHref: (path: string) => string;
}) {
  const available: Record<Metric, boolean> = {
    peso: link.permissions.body,
    pasos: stepsShared(link),
    kcal: link.permissions.nutrition && link.setup?.services?.nutrition !== false,
  };
  const options = METRICS.filter((m) => available[m.id]);
  // Coaches hide what they never read; everything starts visible.
  const [hidden, setHidden] = useState<Metric[]>(readHidden);
  const shows = (id: Metric) => available[id] && !hidden.includes(id);
  const toggle = (id: Metric) => {
    const next = hidden.includes(id) ? hidden.filter((m) => m !== id) : [...hidden, id];
    setHidden(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: the choice lasts until the page closes.
    }
  };
  const weekHref = (week: string) => {
    const [path, query = ''] = recordHref('registro').split('?');
    const next = new URLSearchParams(query);
    next.set('semana', week);
    return `${path}?${next}`;
  };

  if (options.length === 0)
    return (
      <section className="card">
        <h2>Sin registros compartidos</h2>
        <p className="coach-description">
          Tu atleta no comparte peso, pasos ni nutrición. Lo demás está en Métricas.
        </p>
      </section>
    );

  return (
    <>
      <div
        className="segmented coach-tracking-toggle"
        role="toolbar"
        aria-label="Registros mostrados"
      >
        {options.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="segmented-option"
            aria-pressed={shows(id)}
            onClick={() => toggle(id)}
          >
            <Icon size={16} aria-hidden /> {label}
          </button>
        ))}
      </div>
      {(shows('peso') || shows('pasos') || shows('kcal')) && (
        <CoachTracking
          linkId={link.linkId}
          weights={shows('peso')}
          steps={shows('pasos')}
          calories={shows('kcal')}
          weekHref={weekHref}
        />
      )}
    </>
  );
}
