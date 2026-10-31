import { useWorkoutPersistenceError, useUnclaimedWorkoutBackup } from '../lib/workout/storage';
import React, { Suspense } from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { useWorkoutStore, useWorkoutHydrated } from '../lib/workout/store';
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

const VIEW_OPTIONS = [
  { label: 'Resumen', value: 'home' },
  { label: 'Historial', value: 'history' },
  { label: 'Plantillas', value: 'templates' },
  { label: 'Ejercicios', value: 'exercises' },
];

export default function WorkoutPage() {
  const hydrated = useWorkoutHydrated();
  const persistenceError = useWorkoutPersistenceError();
  const unclaimedBackup = useUnclaimedWorkoutBackup();
  const tab = useWorkoutStore((s) => s.tab);
  const { data: exercises, isLoading, isError, refetch } = useExerciseCatalog();
  const pageTitle = <h1 className="sr-only">Entreno</h1>;
  // Resumen and Ejercicios put their sections at h3, so the view's name fills the h2 level.
  const viewTitle = VIEW_OPTIONS.find((o) => o.value === tab)?.label;

  if (!hydrated || isLoading) {
    return (
      <>
        {pageTitle}
        <WorkoutPageSkeleton />
      </>
    );
  }

  if (isError || !exercises) {
    return (
      <>
        {pageTitle}
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
      </>
    );
  }

  return (
    <ErrorBoundary>
      {pageTitle}
      {persistenceError && (
        <p role="alert" className="p-4 mb-4 border rounded-lg">
          {persistenceError}
        </p>
      )}
      {unclaimedBackup && (
        <aside role="status" className="p-4 mb-4 border rounded-lg">
          <p>
            Hay una copia local de entrenamiento sin una cuenta identificada. Puedes descargarla
            para conservarla.
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-2"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([unclaimedBackup], { type: 'application/json' }),
              );
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = 'ascension-entrenamiento-sin-cuenta.json';
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 0);
            }}
          >
            Descargar copia local
          </button>
        </aside>
      )}
      <div className="fade-in">
        <div className="workout-page-wrapper">
          {tab !== 'train' && (
            <SegmentedControl
              options={VIEW_OPTIONS}
              value={tab}
              onChange={(val) =>
                useWorkoutStore
                  .getState()
                  .setTab(val as 'home' | 'history' | 'templates' | 'exercises' | 'train')
              }
              className="mb-6"
            />
          )}
          {viewTitle && <h2 className="sr-only">{viewTitle}</h2>}

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
