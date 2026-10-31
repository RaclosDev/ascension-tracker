import { act, cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Layout from '../components/Layout';

const { querySpy } = vi.hoisted(() => ({
  querySpy: vi.fn(() => ({
    data: {} as object | null,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));
vi.mock('@tanstack/react-query', () => ({ useQuery: querySpy }));
vi.mock('../components/workout/ActiveWorkoutBanner', () => ({ ActiveWorkoutBanner: () => null }));
vi.mock('../lib/workout/store', () => ({
  useWorkoutStore: (select: (state: { active: { startedAt: number } }) => unknown) =>
    select({ active: { startedAt: 0 } }),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('ticks the visible clock without rendering the layout and its queries again', () => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  querySpy.mockClear();
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Layout />
    </MemoryRouter>,
  );
  const initialRenders = querySpy.mock.calls.length;
  for (let i = 0; i < 4; i++)
    act(() => {
      vi.advanceTimersByTime(500);
    });
  expect(screen.getByText('00:02')).toBeInTheDocument();
  expect(querySpy.mock.calls.length - initialRenders).toBe(0);
});

it('shows settings failure with retry instead of onboarding when stale data is null', () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const refetch = vi.fn();
  querySpy.mockReturnValueOnce({
    data: null,
    isLoading: false,
    isError: true,
    isFetching: false,
    refetch,
  });
  render(
    <MemoryRouter initialEntries={['/utilities']}>
      <Layout />
    </MemoryRouter>,
  );
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(refetch).toHaveBeenCalledOnce();
});
