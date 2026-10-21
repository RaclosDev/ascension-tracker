import React, { Suspense } from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { useWorkoutStore } from '../lib/workout/store';
import { SegmentedControl } from '../components/ui/segmented-control';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import { useExerciseCatalog } from '../lib/workout/exercises';
import { WorkoutPageSkeleton } from '../components/workout/skeletons/WorkoutPageSkeleton';

const Dashboard = lazyWithRetry(() => import('../components/workout/dashboard'));
const ActiveWorkout = lazyWithRetry(() => import('../components/workout/active-workout'));
const HistoryView = lazyWithRetry(() => import('../components/workout/history'));
const TemplatesView = lazyWithRetry(() => import('../components/workout/templates'));
const ExercisesView = lazyWithRetry(() => import('../components/workout/exercises-view'));

export default function WorkoutPage() {
  const tab = useWorkoutStore((s) => s.tab);
  const { data: exercises, isLoading, isError, refetch } = useExerciseCatalog();

  if (isLoading) {
    return <WorkoutPageSkeleton />;
  }

  if (isError || !exercises) {
    return (
      <div
        className="p-6 text-center flex flex-col items-center justify-center gap-4 my-8 bg-red-950/20 border border-red-800/40 rounded-2xl"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-red-400 font-medium">No se pudo cargar el catálogo de ejercicios.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn btn-secondary px-4 py-2 text-sm"
          aria-label="Reintentar carga del catálogo de ejercicios"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="fade-in">
        <div className="workout-page-wrapper">
          {tab !== 'train' && (
            <SegmentedControl
              options={[
                { label: 'Resumen', value: 'home' },
                { label: 'Historial', value: 'history' },
                { label: 'Plantillas', value: 'templates' },
                { label: 'Ejercicios', value: 'exercises' },
              ]}
              value={tab}
              onChange={(val) =>
                useWorkoutStore
                  .getState()
                  .setTab(val as 'home' | 'history' | 'templates' | 'exercises' | 'train')
              }
              className="mb-6"
            />
          )}

          <Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              </div>
            }
          >
            {tab === 'train' ? (
              <ActiveWorkout />
            ) : tab === 'templates' ? (
              <TemplatesView />
            ) : tab === 'history' ? (
              <HistoryView />
            ) : tab === 'exercises' ? (
              <ExercisesView />
            ) : (
              <Dashboard />
            )}
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
}
