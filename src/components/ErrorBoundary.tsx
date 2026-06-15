'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
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
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 300, padding: 40, textAlign: 'center', color: 'var(--text-dim)'
        }}>
          <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 20 }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--text-light)', marginBottom: 12 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, maxWidth: 400, marginBottom: 8 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details style={{ fontSize: 12, maxWidth: 500, marginBottom: 24, color: 'var(--text-dim)', textAlign: 'left', width: '100%' }}>
              <summary style={{ cursor: 'pointer', marginBottom: 8, color: 'var(--accent)' }}>
                Error details (click to expand)
              </summary>
              <pre style={{
                background: 'var(--card-bg)',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 11,
                lineHeight: 1.5,
                border: '1px solid var(--border-color)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.message}
                {this.state.error.stack && '\n\n' + this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); }}
            style={{
              padding: '10px 24px', background: 'var(--primary-red)', color: 'var(--text-light)',
              border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontWeight: 600, fontSize: 13, letterSpacing: 1
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
