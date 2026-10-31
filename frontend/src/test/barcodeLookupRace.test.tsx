import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import api from '../api/client';
import { useScannerAndOCR } from '../hooks/my-foods/useScannerAndOCR';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));

it('keeps the latest scanned product when an earlier barcode responds late', async () => {
  let release: (() => void) | undefined;
  vi.mocked(api.get).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = () =>
          resolve({ status: 200, data: { product: { product_name: 'Old product' } } });
      }),
  );
  const { result } = renderHook(() =>
    useScannerAndOCR(vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()),
  );
  let lookup: Promise<void>;
  act(() => {
    lookup = result.current.handleScanBarcode('12345');
  });
  await act(async () => {
    await result.current.handleScanBarcode('{"name":"Latest product","kcal":100}');
  });
  await act(async () => {
    release?.();
    await lookup;
  });
  expect(result.current.scannedProduct?.name).toBe('Latest product');
  expect(result.current.isLookingUpCode).toBe(false);
  expect(vi.mocked(api.get).mock.calls[0][1]?.signal?.aborted).toBe(true);
});
