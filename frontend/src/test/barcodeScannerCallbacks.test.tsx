import { render, waitFor, act, screen, fireEvent, cleanup } from '@testing-library/react';
import { expect, it, vi, afterEach } from 'vitest';
import BarcodeScanner from '../components/BarcodeScanner';

const scanner = vi.hoisted(() => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn(),
  isScanning: false,
}));
vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class {
    static getCameras = vi.fn().mockResolvedValue([
      { id: 'back', label: 'Back' },
      { id: 'front', label: 'Front' },
    ]);
    start = async (...args: unknown[]) => {
      await scanner.start(...args);
      this.isScanning = true;
    };
    stop = async () => {
      await scanner.stop();
      this.isScanning = false;
    };
    clear = scanner.clear;
    isScanning = scanner.isScanning;
  },
  Html5QrcodeSupportedFormats: {},
}));
vi.mock('../lib/haptics', () => ({ haptics: { success: vi.fn() } }));

it('uses the latest scan callback without restarting the camera on a parent render', async () => {
  const first = vi.fn();
  const latest = vi.fn();
  const { rerender } = render(<BarcodeScanner onScanSuccess={first} />);
  await waitFor(() => expect(scanner.start).toHaveBeenCalledTimes(1));
  rerender(<BarcodeScanner onScanSuccess={latest} />);
  const callback = scanner.start.mock.calls[0][2] as (text: string, result: unknown) => void;
  await act(async () => {
    callback('12345678', {});
  });
  expect(latest).toHaveBeenCalledWith('12345678', {});
  expect(first).not.toHaveBeenCalled();
  expect(scanner.start).toHaveBeenCalledTimes(1);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it.each(['resume', 'switch'])(
  'uses the latest callback after camera %s and a parent render',
  async (action) => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = render(<BarcodeScanner onScanSuccess={first} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Pausar Cámara' })).toBeEnabled(),
    );
    if (action === 'resume') {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Pausar Cámara' }));
      });
      expect(scanner.stop).toHaveBeenCalledTimes(1);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar Cámara' }));
      });
    } else {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cambiar Cámara' }));
      });
    }
    expect(scanner.start).toHaveBeenCalledTimes(2);
    rerender(<BarcodeScanner onScanSuccess={latest} />);
    const callback = scanner.start.mock.calls[1][2] as (text: string, result: unknown) => void;
    await act(async () => {
      callback('12345678', {});
    });
    expect(latest).toHaveBeenCalledWith('12345678', {});
    expect(first).not.toHaveBeenCalled();
    expect(scanner.start).toHaveBeenCalledTimes(2);
  },
);
