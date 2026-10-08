import React from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { useWorkoutStore } from '../lib/workout/store';
import { SegmentedControl } from '../components/ui/segmented-control';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() =>
  import('../components/workout/dashboard').then((m) => ({ default: m.Dashboard })),
);
const ActiveWorkout = lazy(() =>
  import('../components/workout/active-workout').then((m) => ({ default: m.ActiveWorkout })),
);
const HistoryView = lazy(() =>
  import('../components/workout/history').then((m) => ({ default: m.HistoryView })),
);
const TemplatesView = lazy(() =>
  import('../components/workout/templates').then((m) => ({ default: m.TemplatesView })),
);
const ExercisesView = lazy(() =>
  import('../components/workout/exercises-view').then((m) => ({ default: m.ExercisesView })),
);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; info: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: '#222' }}>
          <h2>Algo salió mal.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
            {this.state.info?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import { fetchExerciseCatalog, EXERCISE_CATALOG } from '../lib/workout/exercises';
import { Skeleton } from '../components/ui/skeleton';

export default function WorkoutPage() {
  const tab = useWorkoutStore((s) => s.tab);

  const [exercisesLoaded, setExercisesLoaded] = React.useState(EXERCISE_CATALOG.length > 0);

  useEffect(() => {
    if (!exercisesLoaded) {
      fetchExerciseCatalog()
        .then(() => setExercisesLoaded(true))
        .catch(console.error);
    }
  }, [exercisesLoaded]);

  if (!exercisesLoaded) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: 'var(--space-md) 0',
        }}
      >
        <Skeleton style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
        <Skeleton style={{ height: '160px', width: '100%', borderRadius: '16px' }} />
        <Skeleton style={{ height: '140px', width: '100%', borderRadius: '16px' }} />
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





