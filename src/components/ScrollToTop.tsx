'use client';

import { useState, useEffect } from 'react';

/**
 * ScrollToTop — floating button that appears after scrolling down.
 * Clicking smoothly scrolls to the top of the page.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '1px solid var(--border-color)',
        background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)',
        color: 'var(--text-light)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <i className="fa-solid fa-arrow-up" />
    </button>
  );
}
