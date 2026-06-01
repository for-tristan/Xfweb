'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
      color: 'var(--text-light, #efefef)',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        background: '#111',
        border: '1px solid rgba(220, 20, 60, 0.2)',
        borderRadius: 16,
        padding: '48px 32px',
        maxWidth: 480,
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(220, 20, 60, 0.1)',
          border: '2px solid var(--primary-red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 28,
        }}>
          <i className="fa-solid fa-exclamation-triangle" style={{ color: 'var(--warning-color)' }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text-light, #efefef)' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--text-dim, #999)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '12px 32px',
            background: 'var(--primary-red)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
