import toast from 'react-hot-toast';
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { isChunkLoadError, claimChunkReload, clearChunkReloadLocks } from '../utils/lazyWithRetry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkOrMimeError = isChunkLoadError(error);

    if (isChunkOrMimeError && claimChunkReload('ascension_eb_reload_lock')) {
      window.location.reload();
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isChunkOrMimeError = isChunkLoadError(this.state.error);

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#f1f5f9',
            background: '#09090B',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: '10px' }}>
            {isChunkOrMimeError ? 'Nueva versión disponible' : 'Algo salió mal.'}
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            {isChunkOrMimeError
              ? 'No se ha podido cargar un módulo de la versión actual. Actualiza la aplicación para volver a intentarlo.'
              : 'Ha ocurrido un error en la aplicación.'}
          </p>
          {!isChunkOrMimeError && this.state.error?.message && (
            <pre
              style={{
                color: '#ef4444',
                marginBottom: '20px',
                maxWidth: '80%',
                overflowX: 'auto',
                textAlign: 'left',
                padding: '10px',
                background: '#1e1e1e',
                borderRadius: '8px',
              }}
            >
              {this.state.error.message}
              {this.state.error.stack ? (
                <>
                  <br />
                  <br />
                  {this.state.error.stack}
                </>
              ) : null}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={async () => {
                clearChunkReloadLocks();
                try {
                  if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.getRegistration();
                    await registration?.update();
                  }
                } catch {
                  // Reload remains available offline or when the worker update fails.
                }
                const next = new URL(window.location.href);
                next.searchParams.set('v', String(Date.now()));
                window.location.href = next.href;
              }}
            >
              {isChunkOrMimeError ? 'Actualizar aplicación' : 'Recargar'}
            </button>
            {!isChunkOrMimeError && (
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  const text = `${this.state.error?.message || ''}\n\n${this.state.error?.stack || ''}`;
                  try {
                    await navigator.clipboard.writeText(text);
                    toast.success('Error copiado al portapapeles');
                  } catch {
                    toast.error('No se pudo copiar. Puedes seleccionar el texto del error.');
                  }
                }}
              >
                Copiar Error
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
