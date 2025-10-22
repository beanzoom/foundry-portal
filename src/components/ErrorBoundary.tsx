import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          fontFamily: 'monospace',
          backgroundColor: '#fee',
          margin: '20px',
          borderRadius: '8px',
          border: '2px solid #c00'
        }}>
          <h1 style={{ color: '#c00' }}>Application Error</h1>
          <h2>Something went wrong loading the portal</h2>
          <pre style={{
            backgroundColor: '#fff',
            padding: '20px',
            overflow: 'auto',
            borderRadius: '4px'
          }}>
            {this.state.error?.message}
          </pre>
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Stack Trace</summary>
            <pre style={{
              backgroundColor: '#fff',
              padding: '20px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '10px',
              borderRadius: '4px'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
