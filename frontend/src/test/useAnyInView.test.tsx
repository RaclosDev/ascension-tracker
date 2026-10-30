import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { useAnyInView } from '../hooks/use-any-in-view';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let lastCallback: Callback | null = null;
const observed: Element[] = [];

class FakeObserver {
  constructor(callback: Callback) {
    lastCallback = callback;
  }
  observe(el: Element) {
    observed.push(el);
  }
  disconnect() {}
}

function Probe({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const anyInView = useAnyInView(ref, '[data-target]', String(count));
  return (
    <div ref={ref}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} data-target />
      ))}
      <output>{anyInView ? 'visible' : 'hidden'}</output>
    </div>
  );
}

const report = (target: Element, isIntersecting: boolean) =>
  act(() => lastCallback?.([{ target, isIntersecting }]));

describe('useAnyInView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    lastCallback = null;
    observed.length = 0;
  });

  it('reports false when IntersectionObserver is not available', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Probe count={2} />);
    expect(screen.getByText('hidden')).toBeDefined();
  });

  it('reports false when nothing matches the selector', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    render(<Probe count={0} />);
    expect(screen.getByText('hidden')).toBeDefined();
  });

  it('stays true while at least one target intersects', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    render(<Probe count={2} />);
    const [first, second] = observed;

    report(first, true);
    report(second, true);
    expect(screen.getByText('visible')).toBeDefined();

    report(first, false);
    expect(screen.getByText('visible')).toBeDefined();

    report(second, false);
    expect(screen.getByText('hidden')).toBeDefined();
  });
});
