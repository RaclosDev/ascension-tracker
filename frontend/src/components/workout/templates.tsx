import { useState } from 'react';
import { Play, Trash2, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Template } from '@/lib/workout/types';
import '@/styles/workout-session-summary.css';
import { EmptyCard } from '@/components/workout/dashboard';
import { getExerciseMap } from '@/lib/workout/exercises';
import { useWorkoutStore } from '@/lib/workout/store';
import { Skeleton } from '@/components/ui/skeleton';
import { TabAction } from '@/components/workout/tab-action';

import {
  useWorkoutTemplates,
  useDeleteTemplate,
  useCustomExercises,
  useRecentWorkouts,
} from '@/lib/workout/api';

export default function TemplatesView() {
  const { data: templates = [], isLoading } = useWorkoutTemplates();
  const { data: customExercises = [] } = useCustomExercises();
  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const deleteMutation = useDeleteTemplate();

  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const [deleting, setDeleting] = useState<Template | null>(null);
  const startEmpty = useWorkoutStore((s) => s.startEmpty);
  const catalog = getExerciseMap(customExercises);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TabAction>
        <button
          type="button"
          onClick={() => startEmpty('Nueva Plantilla')}
          className="btn btn-primary tab-action-btn"
        >
          <Plus size={16} aria-hidden /> <span className="tab-action-label">Nueva plantilla</span>
        </button>
      </TabAction>

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
        <ul className="wk-tpl-grid">
          {templates.map((tpl: Template) => {
            const names = tpl.exercises.map(
              (e: { exerciseId: string }) => catalog.get(e.exerciseId)?.name ?? 'Ejercicio',
            );
            const count = tpl.exercises.length;
            return (
              <li key={tpl.id} className="card wk-session wk-tpl">
                <div className="wk-tpl-body">
                  <h2 className="wk-tpl-name">{tpl.name}</h2>
                  <p className="workout-session-date">
                    {count} {count === 1 ? 'ejercicio' : 'ejercicios'}
                  </p>
                  <p className="wk-tpl-list">
                    {names.slice(0, 6).join(' · ')}
                    {names.length > 6 ? ` y ${names.length - 6} más` : ''}
                  </p>
                </div>
                <div className="wk-session-actions">
                  <button
                    type="button"
                    onClick={() => startFromTemplate(tpl, recentWorkouts)}
                    className="btn btn-primary btn-sm wk-tpl-start"
                  >
                    <Play size={15} aria-hidden="true" />
                    Empezar
                  </button>
                  <span>
                    <button
                      type="button"
                      className="icon-btn wk-session-delete"
                      aria-label={`Eliminar la plantilla ${tpl.name}`}
                      onClick={() => setDeleting(tpl)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="card wk-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle className="wk-confirm-title">
              ¿Eliminar la plantilla «{deleting?.name}»?
            </AlertDialogTitle>
            <AlertDialogDescription className="wk-confirm-text">
              Los entrenamientos que hiciste con ella siguen en tu historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="wk-confirm-actions">
            <AlertDialogCancel className="btn btn-secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="btn btn-danger btn-press"
              onClick={() => {
                if (!deleting) return;
                deleteMutation.mutate(deleting.id);
                setDeleting(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
