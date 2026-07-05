'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import LenisProvider from '@/components/LenisProvider';

/**
 * ClientProviders — wraps the entire app.
 *
 * Includes a RouteChangeLoader that shows the 3-dot loader instantly when
 * the user clicks a link (router.push / Link). This eliminates the blank
 * screen gap where "nothing happens for a few seconds" — the loader appears
 * immediately, even before the new page's JS bundle has downloaded.
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
    // When pathname changes, a navigation has completed.
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setIsNavigating(false);
      if (navTimer.current) {
        clearTimeout(navTimer.current);
        navTimer.current = null;
      }
    }
  }, [pathname]);

  // Intercept all link clicks and router.push calls to show the loader
  // immediately. We listen for click events on <a> tags and use a
  // MutationObserver-free approach: just intercept clicks.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Only handle internal navigation (not external links, not hash links)
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (link.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // Check if this is a different page
      const currentPath = window.location.pathname;
      const targetPath = href.split('#')[0].split('?')[0];
      if (targetPath === currentPath) return;

      // Show loader immediately
      setIsNavigating(true);

      // Safety timeout: if navigation somehow stalls, hide loader after 10s
      if (navTimer.current) clearTimeout(navTimer.current);
      navTimer.current = setTimeout(() => setIsNavigating(false), 10000);
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
