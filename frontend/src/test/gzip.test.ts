import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gzipJson } from '../api/gzip';

describe('gzipJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips the JSON text through gzip', async () => {
    // jsdom's Blob has no stream(); browsers and Node do.
    vi.stubGlobal('Blob', NodeBlob);
    const json = JSON.stringify({ workouts: Array.from({ length: 200 }, (_, i) => ({ id: i })) });
    const blob = await gzipJson(json);

    expect(blob).not.toBeNull();
    expect(blob!.size).toBeLessThan(json.length);
    const restored = await new Response(
      blob!.stream().pipeThrough(new DecompressionStream('gzip')),
    ).text();
    expect(restored).toBe(json);
  });

  it('returns null when the browser cannot compress', async () => {
    vi.stubGlobal('CompressionStream', undefined);
    await expect(gzipJson('{}')).resolves.toBeNull();
  });
});
