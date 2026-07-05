'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import LenisProvider from '@/components/LenisProvider';

/**
 * ClientProviders — wraps the entire app.
 *
 * Shows a 3-dot loader overlay when navigating between PAGES (route changes).
 * Does NOT trigger on:
 *  - Modal opens (enroll, auth, profile, etc.)
 *  - Button clicks inside cards (enroll, cancel, etc.)
 *  - External links (target="_blank")
 *  - Hash links (#section)
 *  - Project card external link clicks
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const prevPath = useRef(pathname);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('scroll-locked');
  }, []);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setIsNavigating(false);
      if (navTimer.current) {
        clearTimeout(navTimer.current);
        navTimer.current = null;
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      const target = e.target as HTMLElement;

      // Skip clicks inside modals, overlays, or dialog containers
      if (target.closest('[role="dialog"], .auth-modal-overlay, .modal-overlay, .dashboard-modal-overlay, .confirm-modal-overlay, .chat-modal-overlay, .search-modal-overlay, .zai-chat-page')) {
        return;
      }

      // Skip clicks on buttons that are inside cards (enroll, cancel, etc.)
      if (target.closest('button') && !target.closest('a')) {
        return;
      }

      // Check <a> tags
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      if (link) {
        const href = link.getAttribute('href');
        if (!href) return;
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.target === '_blank') return;
        const targetPath = href.split('#')[0].split('?')[0];
        if (targetPath === window.location.pathname) return;

        setIsNavigating(true);
        if (navTimer.current) clearTimeout(navTimer.current);
        navTimer.current = setTimeout(() => setIsNavigating(false), 10000);
        return;
      }

      // Check card divs with role="button" — but ONLY if they navigate
      // to a different page (not modals, not enroll buttons)
      const clickable = target.closest('[role="button"]');
      if (clickable) {
        // Skip if inside a modal or overlay
        if (clickable.closest('[role="dialog"], .auth-modal-overlay, .modal-overlay, .dashboard-modal-overlay, .confirm-modal-overlay, .chat-modal-overlay, .search-modal-overlay')) {
          return;
        }
        // Skip if it's a button element (enroll, cancel, etc.)
        if (clickable.tagName === 'BUTTON') return;

        setIsNavigating(true);
        if (navTimer.current) clearTimeout(navTimer.current);
        navTimer.current = setTimeout(() => setIsNavigating(false), 10000);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return (
    <LenisProvider>
      {isNavigating && (
        <div className="xf-loader" role="status" aria-label="Loading" style={{ zIndex: 99999 }}>
          <div className="xf-loader-dot" />
          <div className="xf-loader-dot" />
          <div className="xf-loader-dot" />
        </div>
      )}
      {children}
    </LenisProvider>
  );
}
