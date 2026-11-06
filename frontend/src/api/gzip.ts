/**
 * Gzips a JSON text for upload, or returns null when the browser cannot, so the caller sends it as is.
 * Backups shrink about tenfold, which keeps large accounts under the proxy and server body limits.
 */
export async function gzipJson(json: string): Promise<Blob | null> {
  if (
    typeof CompressionStream === 'undefined' ||
    typeof Response === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof Blob.prototype.stream !== 'function'
  ) {
    return null;
  }
  try {
    const compressed = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    return await new Response(compressed).blob();
  } catch {
    return null;
  }
}
