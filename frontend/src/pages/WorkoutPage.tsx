import React from 'react';
import { useEffect } from 'react';
import { useWorkoutStore } from '../lib/workout/store';
import { Dashboard } from '../components/workout/dashboard';
import { ActiveWorkout } from '../components/workout/active-workout';
import { HistoryView } from '../components/workout/history';
import { TemplatesView } from '../components/workout/templates';
import { ExercisesView } from '../components/workout/exercises-view';

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: '#222' }}>
          <h2>Algo salió mal.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function WorkoutPage() {
  const tab = useWorkoutStore((s) => s.tab);
  const restoreDemo = useWorkoutStore((s) => s.restoreDemo);

  return (
    <ErrorBoundary>
      <div className="fade-in">
        <div className="workout-page-wrapper" style={{ padding: 'var(--space-md) 0' }}>
        {tab === "train" ? (
          <ActiveWorkout />
        ) : tab === "templates" ? (
          <TemplatesView />
        ) : tab === "history" ? (
          <HistoryView />
        ) : tab === "exercises" ? (
          <ExercisesView />
        ) : (
          <Dashboard />
        )}
      </div>
      </div>
    </ErrorBoundary>
  );
}
