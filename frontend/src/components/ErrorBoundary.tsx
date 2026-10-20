import React, { Component, ReactNode, ErrorInfo } from 'react';

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
    const errorMsg = error?.message || String(error || '');
    const isChunkOrMimeError =
      errorMsg.includes('MIME type') ||
      errorMsg.includes('text/html') ||
      errorMsg.includes('dynamically imported module') ||
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('Importing a module script failed') ||
      errorMsg.includes('error loading dynamically imported module');

    if (isChunkOrMimeError) {
      const alreadyReloaded = sessionStorage.getItem('ascension_eb_reload_lock');
      if (!alreadyReloaded) {
        sessionStorage.setItem('ascension_eb_reload_lock', 'true');
        window.location.reload();
      }
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error || '');
      const isChunkOrMimeError =
        errorMsg.includes('MIME type') ||
        errorMsg.includes('text/html') ||
        errorMsg.includes('dynamically imported module') ||
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('Importing a module script failed') ||
        errorMsg.includes('error loading dynamically imported module');

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
              ? 'Se ha desplegado una nueva versión de Ascension. Pulsa para actualizar a los últimos cambios.'
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
              onClick={() => {
                sessionStorage.removeItem('ascension_chunk_reload_lock');
                sessionStorage.removeItem('ascension_eb_reload_lock');
                window.location.reload();
              }}
            >
              {isChunkOrMimeError ? 'Actualizar aplicación' : 'Recargar'}
            </button>
            {!isChunkOrMimeError && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const text = `${this.state.error?.message || ''}\n\n${this.state.error?.stack || ''}`;
                  navigator.clipboard.writeText(text);
                  alert('Error copiado al portapapeles');
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
