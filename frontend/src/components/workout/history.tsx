import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
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
import toast from 'react-hot-toast';
import { EmptyCard } from '@/components/workout/dashboard';
import { getExerciseMap } from '@/lib/workout/exercises';
import { useWorkoutStore } from '@/lib/workout/store';
import { HistoryItem } from './history-item';
import { WorkoutHistoryDetail } from './history-detail';

import { useWorkoutHistory, useDeleteWorkout, useCustomExercises } from '@/lib/workout/api';

export function HistoryView() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useWorkoutHistory();
  const history = data?.pages.flatMap((page) => page.content) ?? [];
  const { data: customExercises = [] } = useCustomExercises();
  const deleteWorkout = useDeleteWorkout();

  const startFromHistory = useWorkoutStore((s) => s.startFromHistory);
  const editWorkout = useWorkoutStore((s) => s.editWorkout);
  const active = useWorkoutStore((s) => s.active);
  const deleteHistory = (id: string) => deleteWorkout.mutate(id);
  const detailId = useWorkoutStore((s) => s.detailId);
  const setDetailId = useWorkoutStore((s) => s.setDetailId);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const settings = useWorkoutStore((s) => s.settings);
  const showRpe = settings?.showRpe ?? false;
  const catalog = getExerciseMap(customExercises);
  const detail =
    history.find((w: import('@/lib/workout/types').CompletedWorkout) => w.id === detailId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              <article className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                  }}
                >
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : history.length === 0 ? (
        <EmptyCard
          title="El diario está vacío"
          body="Las sesiones terminadas aparecen aquí, con volumen y cada serie."
        />
      ) : (
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
          {history.map((w: import('@/lib/workout/types').CompletedWorkout) => (
            <HistoryItem
              key={w.id}
              w={w}
              catalog={catalog}
              customExercises={customExercises}
              setDetailId={setDetailId}
              editWorkout={editWorkout}
              startFromHistory={startFromHistory}
              deleteHistory={(id) => setDeletingId(id)}
              active={active}
            />
          ))}

          {hasNextPage && (
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '1rem',
                marginTop: '1rem',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'center',
              }}
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Cargando...' : 'Cargar más entrenamientos'}
            </button>
          )}
        </ul>
      )}

      <WorkoutHistoryDetail
        detail={detail}
        history={history}
        catalog={catalog}
        showRpe={showRpe}
        setDetailId={setDetailId}
        setDeletingId={setDeletingId}
        startFromHistory={startFromHistory}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent
          className="card"
          style={{
            maxWidth: '400px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              ¿Borrar entrenamiento?
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}
            >
              Esta sesión se eliminará de tu historial de forma permanente. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
            }}
          >
            <AlertDialogCancel className="btn btn-secondary" onClick={() => setDeletingId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="btn btn-danger btn-press"
              style={{ color: 'var(--color-danger)' }}
              onClick={() => {
                if (deletingId) {
                  deleteHistory(deletingId);
                  if (detailId === deletingId) {
                    setDetailId(null);
                  }
                  setDeletingId(null);
                  toast.success('Entrenamiento eliminado');
                }
              }}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default HistoryView;
