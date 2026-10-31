import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { lazyWithRetry, isChunkLoadError } from '../utils/lazyWithRetry';
import ErrorBoundary from '../components/ErrorBoundary';

describe('lazyWithRetry and Deployment Resilience', () => {
  const originalLocation = window.location;

  let reloadMock = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadMock,
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('renders lazy component successfully when factory resolves', async () => {
    const MockComponent = () => <div>Dashboard Loaded</div>;
    const LazyComp = lazyWithRetry(() => Promise.resolve({ default: MockComponent }));

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComp />
      </Suspense>,
    );

    expect(await screen.findByText('Dashboard Loaded')).toBeDefined();
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it('renders a loaded component when session storage is denied', async () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    const LazyComp = lazyWithRetry(async () => ({ default: () => <div>Available offline</div> }));
    render(
      <ErrorBoundary>
        <Suspense fallback="Loading">
          <LazyComp />
        </Suspense>
      </ErrorBoundary>,
    );
    expect(await screen.findByText('Available offline')).toBeDefined();
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it('offers manual recovery without a reload loop when storage is denied', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('Denied', 'SecurityError');
      });
    }
    const LazyComp = lazyWithRetry(vi.fn().mockRejectedValue(new Error('Loading chunk failed')));
    render(
      <ErrorBoundary>
        <Suspense fallback="Loading">
          <LazyComp />
        </Suspense>
      </ErrorBoundary>,
    );
    expect(await screen.findByRole('button', { name: /Actualizar aplicaci/ })).toBeDefined();
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it('detects MIME type error on chunk failure and automatically reloads window', async () => {
    const mimeError = new Error(
      "Failed to fetch dynamically imported module: 'text/html' is not a valid JavaScript MIME type.",
    );
    const failingFactory = vi.fn().mockRejectedValue(mimeError);

    const LazyComp = lazyWithRetry(failingFactory);

    render(
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <LazyComp />
        </Suspense>
      </ErrorBoundary>,
    );

    // Give microtask loop time to process rejection
    await new Promise((r) => setTimeout(r, 50));

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('ascension_chunk_reload_lock')).toBe('true');
  });

  it('recognizes _result.default Safari JavaScriptCore TypeError as chunk load error', () => {
    expect(
      isChunkLoadError("TypeError: undefined is not an object (evaluating 'e._result.default')"),
    ).toBe(true);
    expect(
      isChunkLoadError(
        new Error("TypeError: Cannot read properties of undefined (reading 'default')"),
      ),
    ).toBe(true);
    expect(
      isChunkLoadError(
        new Error('Failed to load component chunk: invalid module or missing default export'),
      ),
    ).toBe(true);
  });

  it('reloads when factory resolves with missing default export', async () => {
    const invalidFactory = vi.fn().mockResolvedValue({});
    const LazyComp = lazyWithRetry(invalidFactory);

    render(
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <LazyComp />
        </Suspense>
      </ErrorBoundary>,
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('ascension_chunk_reload_lock')).toBe('true');
  });

  it('ErrorBoundary renders clean update prompt without undefined when chunk error occurs', () => {
    const chunkError = new Error(
      "Failed to fetch dynamically imported module: 'text/html' is not a valid JavaScript MIME type.",
    );

    const ThrowingComponent = () => {
      throw chunkError;
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Nueva versión disponible')).toBeDefined();
    expect(
      screen.getByText(/No se ha podido cargar un módulo|Se ha desplegado una nueva versión/i),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Actualizar aplicación/i })).toBeDefined();

    // Verify raw "undefined" is NEVER rendered to the user
    expect(screen.queryByText('undefined')).toBeNull();
  });
});
