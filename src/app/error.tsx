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
    // Log to server for debugging Edge-specific issues
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message || 'Unknown error',
          stack: error?.stack?.substring(0, 2000) || '',
          digest: error?.digest || '',
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch {}
  }, [error]);

  return (
    <div className="xf-error-page">
      <div className="xf-error-card">
        <div className="xf-error-icon-wrap">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <h1 className="xf-error-title">Something went wrong</h1>
        <p className="xf-error-text">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error?.message && (
          <p className="xf-error-text" style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8, wordBreak: 'break-word' }}>
            {error.message}
          </p>
        )}
        <button onClick={reset} className="xf-error-btn">
          Try again
        </button>
      </div>
    </div>
  );
}
