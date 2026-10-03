import { Play, Trash2 } from 'lucide-react';
import { EmptyCard } from '@/components/workout/dashboard';
import { getExerciseMap } from '@/lib/workout/exercises';
import { useWorkoutStore } from '@/lib/workout/store';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useWorkoutTemplates,
  useDeleteTemplate,
  useCustomExercises,
  useRecentWorkouts,
} from '@/lib/workout/api';

export function TemplatesView() {
  const { data: templates = [], isLoading } = useWorkoutTemplates();
  const { data: customExercises = [] } = useCustomExercises();
  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const deleteMutation = useDeleteTemplate();

  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const deleteTemplate = (id: string) => deleteMutation.mutate(id);
  const startEmpty = useWorkoutStore((s) => s.startEmpty);
  const catalog = getExerciseMap(customExercises);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: '0.5rem',
        }}
      >
        <button
          onClick={startEmpty}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.8rem',
            fontSize: '0.9rem',
          }}
        >
          <Play size={16} />
          Nueva Plantilla
        </button>
      </header>

      {isLoading ? (
        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: 0,
            margin: 0,
            listStyle: 'none',
          }}
        >
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : templates.length === 0 ? (
        <EmptyCard
          title="Sin plantillas"
          body="Guarda un entreno como plantilla para reutilizarlo."
        />
      ) : (
        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            padding: 0,
            margin: 0,
            listStyle: 'none',
          }}
        >
          {templates.map((tpl) => {
            const names = tpl.exercises.map((e) => catalog.get(e.exerciseId)?.name ?? 'Ejercicio');
            return (
              <li
                key={tpl.id}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <h2
                      style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}
                    >
                      {tpl.name}
                    </h2>
                    <p
                      style={{
                        marginTop: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {tpl.exercises.length} ejercicios
                    </p>
                  </div>
                  <button
                    aria-label="Eliminar plantilla"
                    onClick={() => deleteTemplate(tpl.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: '0.25rem',
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p
                  style={{
                    marginTop: '0.75rem',
                    flex: 1,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {names.slice(0, 6).join(' · ')}
                  {names.length > 6 ? '' : ''}
                </p>
                <button
                  onClick={() => startFromTemplate(tpl, recentWorkouts)}
                  className="btn btn-primary"
                  style={{
                    marginTop: '1.25rem',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Play size={18} />
                  Empezar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}




