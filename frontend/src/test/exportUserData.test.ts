import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api, { exportUserData } from '../api/client';

describe('exportUserData', () => {
  let originalCreateObjectURL: typeof window.URL.createObjectURL;
  let originalRevokeObjectURL: typeof window.URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateObjectURL = window.URL.createObjectURL;
    originalRevokeObjectURL = window.URL.revokeObjectURL;

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-uuid');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('downloads blob using filename from Content-Disposition header', async () => {
    const mockBlob = new Blob(['{"version":"1.0"}'], { type: 'application/json' });
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: mockBlob,
      headers: {
        'content-disposition': 'attachment; filename="ascension-backup-2026-10-13.json"',
      },
    });

    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement;
      if (tagName.toLowerCase() === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    await exportUserData();

    expect(api.get).toHaveBeenCalledWith('/user/export', { responseType: 'blob' });
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-uuid');
  });

  it('falls back to default dated filename when Content-Disposition is missing', async () => {
    const mockBlob = new Blob(['{"version":"1.0"}'], { type: 'application/json' });
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: mockBlob,
      headers: {},
    });

    let downloadedFilename: string | null = null;
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement;
      if (tagName.toLowerCase() === 'a') {
        el.click = vi.fn();
        const origSetAttribute = el.setAttribute.bind(el);
        el.setAttribute = (name: string, value: string) => {
          if (name === 'download') {
            downloadedFilename = value;
          }
          origSetAttribute(name, value);
        };
      }
      return el;
    });

    await exportUserData();

    expect(downloadedFilename).toMatch(/^ascension-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
