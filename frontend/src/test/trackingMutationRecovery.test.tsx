import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { TrackingEntryModal } from '../components/tracking/TrackingEntryModal';
import type { TrackingDayCell } from '../components/tracking/TrackingDayCell';
import TrackingPage from '../pages/TrackingPage';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  delete: vi.fn(),
  invalidate: vi.fn(),
  error: vi.fn(),
}));
vi.mock('../api/client', () => ({ default: { post: mocks.post, delete: mocks.delete } }));
vi.mock('react-hot-toast', () => ({ default: { error: mocks.error, success: vi.fn() } }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
  useQuery: () => ({
    data: [{ weekStart: '2026-10-26', days: [{ weight: 80, steps: 100, calories: null }] }],
    isLoading: false,
  }),
}));
vi.mock('../components/tracking/TrackingWeeklyStats', () => ({ TrackingWeeklyStats: () => null }));
vi.mock('../components/tracking/TrackingDayCell', () => ({
  TrackingDayCell: (props: ComponentProps<typeof TrackingDayCell>) => (
    <button onClick={() => props.onOpenModal(props)}>Open day</button>
  ),
}));
vi.mock('../components/tracking/TrackingEntryModal', () => ({
  TrackingEntryModal: (props: ComponentProps<typeof TrackingEntryModal>) =>
    props.modalData && (
      <div>
        <input
          aria-label="Weight"
          value={props.modalWeight}
          onChange={(event) => props.onWeightChange(event.target.value)}
        />
        <input
          aria-label="Steps"
          value={props.modalSteps}
          onChange={(event) => props.onStepsChange(event.target.value)}
        />
        <button disabled={props.pending} onClick={props.onSave}>
          Save day
        </button>
        <button disabled={props.pending} onClick={props.onDelete}>
          Delete day
        </button>
      </div>
    ),
}));
beforeEach(() => {
  mocks.post.mockResolvedValue({});
  mocks.delete.mockResolvedValue({});
  mocks.invalidate.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('rejects invalid steps before saving an otherwise valid weight', async () => {
  render(<TrackingPage />);
  fireEvent.click(screen.getByText('Open day'));
  fireEvent.change(screen.getByLabelText('Weight'), { target: { value: '81' } });
  fireEvent.change(screen.getByLabelText('Steps'), { target: { value: '12.5' } });
  fireEvent.click(screen.getByText('Save day'));
  expect(mocks.post).not.toHaveBeenCalled();
  expect(mocks.error).toHaveBeenCalled();
});

it.each(['Save day', 'Delete day'])(
  'refreshes partial %s and retries only the remaining change',
  async (action) => {
    const write = action === 'Save day' ? mocks.post : mocks.delete;
    write
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({});
    render(<TrackingPage />);
    fireEvent.click(screen.getByText('Open day'));
    fireEvent.change(screen.getByLabelText('Weight'), { target: { value: '81' } });
    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: '200' } });
    fireEvent.click(screen.getByText(action));
    await waitFor(() =>
      expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['trackingWeeks'] }),
    );
    await waitFor(() => expect(screen.getByText(action).hasAttribute('disabled')).toBe(false));
    expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining('Parte de los cambios'));
    fireEvent.click(screen.getByText(action));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(3));
    expect(write.mock.calls[2][0]).toMatch(/^\/steps/);
  },
);
