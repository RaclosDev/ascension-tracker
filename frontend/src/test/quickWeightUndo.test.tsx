import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';

const { toastSuccess, toastError, toastDismiss, post, del } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastDismiss: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: toastSuccess,
    error: toastError,
    dismiss: toastDismiss,
  }),
}));
vi.mock('../api/client', () => ({ default: { post, delete: del } }));
vi.mock('../lib/haptics', () => ({
  haptics: { success: vi.fn(), error: vi.fn(), medium: vi.fn() },
}));

import { QuickWeightCard } from '../components/dashboard/QuickWeightCard';

function mount(todayWeight: number | undefined) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <QuickWeightCard
        todayLabel="Viernes"
        todayDateStr="2026-11-27"
        todayWeight={todayWeight}
        recentWeight={80}
        hasTodayWeight={todayWeight !== undefined}
        variant="hero"
      />
    </QueryClientProvider>,
  );
}

/** Saves 79.5 and clicks the «Deshacer» button of the toast that shows up. */
async function saveAndUndo() {
  const input = screen.getByLabelText('Peso corporal de hoy en kilogramos');
  fireEvent.change(input, { target: { value: '79.5' } });
  fireEvent.click(screen.getByRole('button', { name: /peso corporal de hoy/i }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith('/weights', { date: '2026-11-27', weight: 79.5 }),
  );
  await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  const content = toastSuccess.mock.calls[0][0] as (t: { id: string }) => ReactNode;
  const view = renderToast(content({ id: 't1' }));
  fireEvent.click(view);
}

function renderToast(node: ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  render(<>{node}</>, { container: host });
  return host.querySelector('button') as HTMLButtonElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  post.mockResolvedValue({});
  del.mockResolvedValue({});
});

it('undoing the first weight of the day deletes it', async () => {
  mount(undefined);
  await saveAndUndo();
  await waitFor(() => expect(del).toHaveBeenCalledWith('/weights/2026-11-27'));
  expect(toastSuccess).toHaveBeenLastCalledWith('Peso eliminado');
});

it('undoing a correction posts the previous weight again', async () => {
  mount(80.2);
  await saveAndUndo();
  await waitFor(() =>
    expect(post).toHaveBeenLastCalledWith('/weights', { date: '2026-11-27', weight: 80.2 }),
  );
  expect(del).not.toHaveBeenCalled();
  expect(toastSuccess).toHaveBeenLastCalledWith('Peso restaurado: 80.2 kg');
});

it('says so when the undo fails', async () => {
  del.mockRejectedValue(new Error('boom'));
  mount(undefined);
  await saveAndUndo();
  await waitFor(() => expect(toastError).toHaveBeenCalledWith('No se pudo deshacer el peso'));
});
