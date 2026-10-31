import { StrictMode } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BarcodeScanner from '../components/BarcodeScanner';

const scanner = vi.hoisted(() => {
  const instances: {
    isScanning: boolean;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  }[] = [];
  return { instances, getCameras: vi.fn(), begin: vi.fn() };
});
vi.mock('html5-qrcode', () => ({
  Html5QrcodeSupportedFormats: {},
  Html5Qrcode: class {
    static getCameras = scanner.getCameras;
    isScanning = false;
    start = vi.fn(async () => {
      await scanner.begin();
      this.isScanning = true;
    });
    stop = vi.fn(async () => {
      this.isScanning = false;
    });
    clear = vi.fn();
    constructor() {
      scanner.instances.push(this);
    }
  },
}));
beforeEach(() => {
  scanner.instances.length = 0;
  scanner.getCameras.mockResolvedValue([]);
  scanner.begin.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('stops a camera whose start finishes after unmount', async () => {
  let finishStart: (() => void) | undefined;
  scanner.begin.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finishStart = resolve;
      }),
  );
  const view = render(<BarcodeScanner />);
  await waitFor(() => expect(scanner.instances[0].start).toHaveBeenCalledOnce());
  view.unmount();
  await act(async () => {
    finishStart?.();
  });
  await waitFor(() => expect(scanner.instances[0].stop).toHaveBeenCalledOnce());
  expect(scanner.instances[0].isScanning).toBe(false);
});

it('does not start or clear the replacement scanner from a discarded StrictMode effect', async () => {
  const view = render(
    <StrictMode>
      <BarcodeScanner />
    </StrictMode>,
  );
  await waitFor(() => expect(scanner.instances[1].start).toHaveBeenCalledOnce());
  expect(scanner.instances[0].start).not.toHaveBeenCalled();
  expect(scanner.instances[0].clear).not.toHaveBeenCalled();
  expect(scanner.instances[1].clear).not.toHaveBeenCalled();
  view.unmount();
  await waitFor(() => expect(scanner.instances[1].stop).toHaveBeenCalledOnce());
});
