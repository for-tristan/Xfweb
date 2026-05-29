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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 300, padding: 40, textAlign: 'center', color: 'var(--text-dim)'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: 48, color: 'var(--primary-red)', marginBottom: 20 }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--text-light)', marginBottom: 12 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              padding: '10px 24px', background: 'var(--primary-red)', color: '#fff',
              border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontWeight: 600, fontSize: 13, letterSpacing: 1
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
