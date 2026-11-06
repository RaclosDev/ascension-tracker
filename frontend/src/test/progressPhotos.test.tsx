import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('../lib/progressPhotos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/progressPhotos')>()),
  compressPhoto: vi.fn(async () => new Blob(['x'], { type: 'image/webp' })),
}));

import api from '../api/client';
import ProgressPhotosSection from '../components/photos/ProgressPhotosSection';
import { PhotoGallery } from '../components/photos/PhotoGallery';
import { fitWithin, groupByDay, type ProgressPhoto } from '../lib/progressPhotos';

const mockedApi = vi.mocked(api);

const photo = (over: Partial<ProgressPhoto> = {}): ProgressPhoto => ({
  id: 'p1',
  pose: 'FRONT',
  takenOn: '2026-11-02',
  url: 'https://photos.test/p1.webp',
  sizeBytes: 250000,
  createdAt: '2026-11-02T10:00:00Z',
  ...over,
});

function wrap(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('fitWithin', () => {
  it('shrinks the longest side to 1600 and never enlarges', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe('groupByDay', () => {
  it('groups by day keeping front, side and back in order', () => {
    const days = groupByDay([
      photo({ id: 'b', pose: 'BACK' }),
      photo({ id: 'f', pose: 'FRONT' }),
      photo({ id: 'old', takenOn: '2026-10-01' }),
    ]);
    expect(days.map((d) => d.takenOn)).toEqual(['2026-11-02', '2026-10-01']);
    expect(days[0].photos.map((p) => p.id)).toEqual(['f', 'b']);
  });
});

describe('Fotos de progreso del alumno', () => {
  it('says so when the server has no photo storage', async () => {
    mockedApi.get.mockResolvedValue({ data: { enabled: false, photos: [] } });
    wrap(<ProgressPhotosSection />);
    expect(await screen.findByText('Las fotos aún no están disponibles.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Añadir foto' })).toBeNull();
  });

  it('uploads the shrunk photo with the chosen pose and date', async () => {
    mockedApi.get.mockResolvedValue({ data: { enabled: true, photos: [] } });
    mockedApi.post.mockResolvedValue({ data: photo() });
    wrap(<ProgressPhotosSection />);

    fireEvent.click(await screen.findByRole('button', { name: 'Perfil' }));
    const file = new File(['raw'], 'IMG_0001.HEIC', { type: 'image/heic' });
    fireEvent.change(screen.getByLabelText('Elegir foto de progreso'), {
      target: { files: [file] },
    });

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());
    const [url, form] = mockedApi.post.mock.calls[0] as [string, FormData];
    expect(url).toBe('/progress-photos');
    expect(form.get('pose')).toBe('SIDE');
    expect(form.get('takenOn')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((form.get('file') as File).name).toBe('photo.webp');
  });

  it('asks before deleting a photo', async () => {
    mockedApi.get.mockResolvedValue({ data: { enabled: true, photos: [photo()] } });
    mockedApi.delete.mockResolvedValue({ data: null });
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    wrap(<ProgressPhotosSection />);

    const button = await screen.findByRole('button', { name: /Borrar foto: Frente/ });
    fireEvent.click(button);
    expect(mockedApi.delete).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/progress-photos/p1'));
    confirm.mockRestore();
  });
});

describe('PhotoGallery', () => {
  it('is read-only without a delete handler', () => {
    render(<PhotoGallery photos={[photo()]} />);
    expect(screen.getByRole('img', { name: /Frente, 2 de noviembre 2026/ })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
