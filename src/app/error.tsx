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
    <div className="xf-error-page">
      <div className="xf-error-card">
        <div className="xf-error-icon-wrap">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <h1 className="xf-error-title">Something went wrong</h1>
        <p className="xf-error-text">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button onClick={reset} className="xf-error-btn">
          Try again
        </button>
      </div>
    </div>
  );
}
