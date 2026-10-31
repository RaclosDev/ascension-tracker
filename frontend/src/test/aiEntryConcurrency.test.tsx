import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import api from '../api/client';
import { useFoodAiEntry } from '../hooks/food/useFoodAiEntry';
import { useAiAssistant } from '../hooks/my-foods/useAiAssistant';
import { useScannerAndOCR } from '../hooks/my-foods/useScannerAndOCR';

vi.mock('../api/client', () => ({ default: { post: vi.fn() } }));
vi.mock('../hooks/useSpeechToText', () => ({
  useSpeechToText: () => ({ stopListening: vi.fn() }),
}));
beforeEach(() => {
  vi.clearAllMocks();
});

it('sends one AI food log when submit is invoked twice before rendering', async () => {
  let release: (() => void) | undefined;
  vi.mocked(api.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ data: [] });
      }),
  );
  const { result } = renderHook(() =>
    useFoodAiEntry({
      query: 'rice',
      setQuery: vi.fn(),
      selectedMealIndex: 0,
      selectedMealKey: 'meal-a',
      stopListening: vi.fn(),
    }),
  );
  let first: Promise<unknown>;
  let second: Promise<unknown>;
  act(() => {
    first = result.current.submitAiPrompt();
    second = result.current.submitAiPrompt();
  });
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledWith(
    '/nutrition/ai/log',
    expect.objectContaining({ mealKey: 'meal-a' }),
    expect.anything(),
  );
  await act(async () => {
    release?.();
    await Promise.all([first, second]);
  });
});

it('does not add the same pending AI food twice and restores failed input', async () => {
  let reject: (() => void) | undefined;
  vi.mocked(api.post).mockImplementation(
    () =>
      new Promise((_resolve, fail) => {
        reject = () => fail(new Error('network'));
      }),
  );
  const { result } = renderHook(() => useAiAssistant(vi.fn()));
  act(() => {
    result.current.setAiQuery('rice');
  });
  const event = { preventDefault: vi.fn() } as unknown as FormEvent;
  let first: Promise<void>;
  let second: Promise<void>;
  act(() => {
    first = result.current.handleAiSubmit(event);
    second = result.current.handleAiSubmit(event);
  });
  expect(api.post).toHaveBeenCalledTimes(1);
  await act(async () => {
    reject?.();
    await Promise.all([first, second]);
  });
  expect(result.current.aiQuery).toBe('rice');
});

it('does not process the same OCR file twice while it is pending', async () => {
  let release: (() => void) | undefined;
  vi.mocked(api.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ data: { name: 'Latest' } });
      }),
  );
  const updateForm = vi.fn();
  const { result } = renderHook(() =>
    useScannerAndOCR(vi.fn(), vi.fn(), vi.fn(), updateForm, vi.fn()),
  );
  const file = new File(['image'], 'label.png', { type: 'image/png' });
  const event = {
    target: { files: [file], value: 'label.png' },
  } as unknown as ChangeEvent<HTMLInputElement>;
  let first: Promise<void>;
  let second: Promise<void>;
  act(() => {
    first = result.current.handleOcrUpload(event);
    second = result.current.handleOcrUpload(event);
  });
  expect(api.post).toHaveBeenCalledTimes(1);
  await act(async () => {
    release?.();
    await Promise.all([first, second]);
  });
  expect(updateForm).toHaveBeenCalledTimes(1);
});
