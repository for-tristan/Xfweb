'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * PageViewTracker — fires a beacon to /api/track-view on every route change.
 *
 * This captures page views for BOTH anonymous visitors and authenticated
 * users. The beacon is fire-and-forget (no error handling needed).
 *
 * Uses sendBeacon when available (survives page unload), falls back to
 * fetch with keepalive.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string>('');

  useEffect(() => {
    if (!pathname) return;
    // Avoid double-firing on same path (React Strict Mode in dev)
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Don't track API routes or Next.js internal routes
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return;

    const body = JSON.stringify({ path: pathname });

    // Use sendBeacon for reliability (survives page navigation/unload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/track-view', blob);
      if (ok) return;
    }

    // Fallback: fetch with keepalive
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
