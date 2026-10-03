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
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#f1f5f9', background: '#09090B', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px' }}>Algo salió mal.</h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Ha ocurrido un error en la aplicación.</p>
          <pre style={{ color: '#ef4444', marginBottom: '20px', maxWidth: '80%', overflowX: 'auto', textAlign: 'left', padding: '10px', background: '#1e1e1e', borderRadius: '8px' }}>
            {this.state.error?.message}
            <br/><br/>
            {this.state.error?.stack}
          </pre>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => {
              const text = `${this.state.error?.message}\n\n${this.state.error?.stack}`;
              navigator.clipboard.writeText(text);
              alert('Error copiado al portapapeles');
            }}>
              Copiar Error
            </button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Recargar</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;




