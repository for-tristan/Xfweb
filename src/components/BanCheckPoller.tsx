'use client';

import { useEffect } from 'react';

/**
 * BanCheckPoller — client-side component that periodically checks if the
 * current user has been banned. If banned, immediately redirects to /banned.
 *
 * This makes bans instant — the admin bans a user, and within 10 seconds
 * the user is redirected to /banned without needing to refresh.
 *
 * Polls /api/ban-check (lightweight endpoint that checks IP + device +
 * email bans) every 10 seconds.
 */
export default function BanCheckPoller() {
  useEffect(() => {
    const checkBan = async () => {
      try {
        const res = await fetch('/api/ban-check', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.banned) {
            // Build redirect URL with ban info
            const params = new URLSearchParams();
            if (data.ip) params.set('ip', data.ip);
            if (data.email) params.set('email', data.email);
            if (data.device) params.set('device', data.device);
            if (data.reason) params.set('reason', data.reason);
            // Hard redirect (not router.push) so the root layout re-runs
            window.location.href = `/banned?${params.toString()}`;
          }
        }
      } catch {
        // Network error — skip this check, try again next interval
      }
    };

    // Check immediately on mount
    checkBan();

    // Then check every 10 seconds
    const interval = setInterval(checkBan, 10000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
