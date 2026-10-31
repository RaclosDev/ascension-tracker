import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import WorkoutPage from '../pages/WorkoutPage';

const state = vi.hoisted(() => ({ hydrated: false, error: null as string | null }));
vi.mock('../lib/workout/store', () => ({
  useWorkoutHydrated: () => state.hydrated,
  useWorkoutStore: (select: (state: { tab: string }) => unknown) => select({ tab: 'home' }),
}));
vi.mock('../lib/workout/storage', () => ({
  useWorkoutPersistenceError: () => state.error,
  useUnclaimedWorkoutBackup: () => null,
}));
vi.mock('../lib/workout/exercises', () => ({
  useExerciseCatalog: () => ({ data: [], isLoading: false }),
}));
vi.mock('../components/workout/dashboard', () => ({
  default: () => <button>Iniciar sesión</button>,
}));
afterEach(() => {
  cleanup();
  state.hydrated = false;
  state.error = null;
});

it('keeps session actions unavailable until saved workout hydration has completed', async () => {
  const { rerender } = render(<WorkoutPage />);
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).not.toBeInTheDocument();
  state.hydrated = true;
  state.error = 'No se pudo leer el entrenamiento guardado.';
  rerender(<WorkoutPage />);
  expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(state.error);
});
