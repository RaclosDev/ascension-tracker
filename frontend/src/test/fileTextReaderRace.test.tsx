import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useFileTextReader } from '../components/ui/useFileTextReader';

class DeferredReader {
  static instances: DeferredReader[] = [];
  readyState = 1;
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  abort = vi.fn();
  readAsText = vi.fn();
  constructor() {
    DeferredReader.instances.push(this);
  }
  finish(text: string) {
    this.result = text;
    this.onload?.();
  }
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  DeferredReader.instances.length = 0;
});
it('ignores replaced and closed file reads even if an aborted reader still dispatches a callback', () => {
  vi.stubGlobal('FileReader', DeferredReader);
  const { result, rerender } = renderHook(({ open }) => useFileTextReader(open), {
    initialProps: { open: true },
  });
  const parsed = vi.fn();
  act(() => result.current.read(new File(['a'], 'a.csv'), parsed, vi.fn()));
  act(() => result.current.read(new File(['b'], 'b.csv'), parsed, vi.fn()));
  act(() => DeferredReader.instances[0].finish('old'));
  expect(parsed).not.toHaveBeenCalled();
  act(() => DeferredReader.instances[1].finish('latest'));
  expect(parsed).toHaveBeenCalledExactlyOnceWith('latest');
  act(() => result.current.read(new File(['c'], 'c.csv'), parsed, vi.fn()));
  rerender({ open: false });
  act(() => DeferredReader.instances[2].finish('closed'));
  expect(parsed).toHaveBeenCalledTimes(1);
  expect(DeferredReader.instances[2].abort).toHaveBeenCalledOnce();
});
