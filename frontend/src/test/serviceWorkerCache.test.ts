import { describe, it, expect, beforeEach, vi } from 'vitest';
import { purgeAllCaches } from '../context/AuthContext';

describe('Service Worker & CacheStorage purging (Audit #4)', () => {
  let deletedCaches: string[] = [];
  const fakeCaches = [
    'api-cache',
    'food-search-cache',
    'workbox-precache-v2',
    'other-app-cache',
    'exercises-catalog-cache',
  ];

  beforeEach(() => {
    deletedCaches = [];
    const mockCaches = {
      keys: vi.fn().mockResolvedValue([...fakeCaches]),
      delete: vi.fn().mockImplementation((name: string) => {
        deletedCaches.push(name);
        return Promise.resolve(true);
      }),
      match: vi.fn(),
      open: vi.fn(),
      has: vi.fn(),
    };

    // Assign to global window.caches
    Object.defineProperty(window, 'caches', {
      value: mockCaches,
      writable: true,
      configurable: true,
    });
  });

  it('purgeAllCaches deletes runtime caches but preserves workbox precache for offline shell', async () => {
    await purgeAllCaches();

    expect(window.caches.keys).toHaveBeenCalled();
    expect(window.caches.delete).toHaveBeenCalledTimes(2);
    expect(deletedCaches).toEqual(['api-cache', 'food-search-cache']);
    expect(deletedCaches).not.toContain('workbox-precache-v2');
  });

  it('handles empty cache list cleanly', async () => {
    Object.defineProperty(window, 'caches', {
      value: {
        keys: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    await purgeAllCaches();
    expect(window.caches.keys).toHaveBeenCalled();
    expect(window.caches.delete).not.toHaveBeenCalled();
  });

  it('handles window without caches gracefully without throwing', async () => {
    Object.defineProperty(window, 'caches', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await expect(purgeAllCaches()).resolves.not.toThrow();
  });
});
