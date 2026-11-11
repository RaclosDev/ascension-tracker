import type { SavedWeek } from './weeks';

export function downloadWeekBackup(local: SavedWeek, saved: SavedWeek) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ format: 'ascension-week-backup-v1', local, saved }, null, 2)], {
      type: 'application/json',
    }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `semana-${local.weekStart}-ambas-versiones.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
