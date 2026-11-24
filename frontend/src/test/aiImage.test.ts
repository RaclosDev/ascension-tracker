import { beforeEach, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import { compressPhoto } from '../lib/progressPhotos';
import { readAiImage, shrinkAiImage } from '../utils/aiImage';
import { isChunkLoadError } from '../utils/lazyWithRetry';

vi.mock('../lib/progressPhotos', () => ({ compressPhoto: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

const photo = (bytes: number) => new File([new Uint8Array(bytes)], 'plato.jpg');

beforeEach(() => vi.clearAllMocks());

it('sends the shrunk photo, not the camera file', async () => {
  const small = new Blob(['small'], { type: 'image/webp' });
  vi.mocked(compressPhoto).mockResolvedValue(small);
  expect(await shrinkAiImage(photo(9 * 1024 * 1024))).toBe(small);
  expect(await readAiImage(photo(9 * 1024 * 1024))).toMatch(/^data:image\/webp;base64,/);
});

it('keeps a photo the browser cannot decode when it already fits', async () => {
  vi.mocked(compressPhoto).mockRejectedValue(new Error('decode'));
  const file = photo(1024);
  expect(await shrinkAiImage(file)).toBe(file);
});

it('rejects a photo that would exceed the API body limit', async () => {
  vi.mocked(compressPhoto).mockRejectedValue(new Error('decode'));
  expect(await readAiImage(photo(6 * 1024 * 1024))).toBeNull();
  expect(toast.error).toHaveBeenCalled();
});

it('does not take a failed API call for a stale chunk', () => {
  expect(isChunkLoadError(new TypeError('Failed to fetch'))).toBe(false);
  expect(isChunkLoadError('Unexpected content type text/html')).toBe(false);
  expect(isChunkLoadError('Failed to fetch dynamically imported module: /assets/a.js')).toBe(true);
});
