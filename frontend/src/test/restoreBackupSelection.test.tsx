import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RestoreBackupModal } from '../components/settings/RestoreBackupModal';

const restore = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ mode: 'OVERWRITE', workoutsRestored: 0, foodLogsRestored: 0 }),
);
vi.mock('../api/client', () => ({ restoreUserData: restore }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

class DeferredReader {
  static instances: DeferredReader[] = [];
  onload: ((event: { target: { result: string } }) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 1;
  abort = vi.fn();
  readAsText = vi.fn();
  constructor() {
    DeferredReader.instances.push(this);
  }
  finish(marker: string) {
    this.onload?.({ target: { result: JSON.stringify({ version: '1.0', marker, workouts: [] }) } });
  }
}
function setup() {
  vi.stubGlobal('FileReader', DeferredReader);
  return render(<RestoreBackupModal isOpen onClose={vi.fn()} />);
}
function select(name: string) {
  fireEvent.change(screen.getByLabelText('Seleccionar archivo de copia de seguridad JSON'), {
    target: { files: [new File(['{}'], name, { type: 'application/json' })] },
  });
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  DeferredReader.instances.length = 0;
});

it('restores only the latest selected file when older reads finish last', async () => {
  setup();
  select('older.json');
  select('latest.json');
  act(() => DeferredReader.instances[1].finish('latest'));
  act(() => DeferredReader.instances[0].finish('older'));
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar restauraci\u00f3n de copia' })),
  );
  expect(restore).toHaveBeenCalledWith(
    expect.objectContaining({ marker: 'latest' }),
    'OVERWRITE',
    true,
  );
});

it('requires a fresh overwrite confirmation after changing file', () => {
  setup();
  select('older.json');
  act(() => DeferredReader.instances[0].finish('older'));
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByText('Cambiar archivo'));
  select('latest.json');
  act(() => DeferredReader.instances[1].finish('latest'));
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(
    screen.getByRole('button', { name: 'Confirmar restauraci\u00f3n de copia' }),
  ).toBeDisabled();
});

it('ignores a pending read that finishes after close and reopen', () => {
  const view = setup();
  select('old.json');
  view.rerender(<RestoreBackupModal isOpen={false} onClose={vi.fn()} />);
  view.rerender(<RestoreBackupModal isOpen onClose={vi.fn()} />);
  act(() => DeferredReader.instances[0].finish('old'));
  expect(screen.queryByRole('button', { name: 'Confirmar restauraci\u00f3n de copia' })).toBeNull();
});
