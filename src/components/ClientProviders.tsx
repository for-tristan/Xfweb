'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import LenisProvider from '@/components/LenisProvider';

/**
 * ClientProviders — wraps the entire app.
 *
 * Shows a 3-dot loader overlay instantly whenever the user navigates to a
 * new page. Intercepts BOTH <a> tag clicks AND div/button onClick
 * navigations (router.push) by detecting pathname changes with a small
 * delay — if the pathname hasn't changed within 50ms of a click, we know
 * a client-side navigation is in progress (router.push was called).
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

  // Hide loader when pathname actually changes (navigation completed)
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

  // Intercept ALL clicks — catches both <a> tags and div onClick+router.push
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Skip modified clicks (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      const target = e.target as HTMLElement;

      // Check if clicking something that will navigate
      // 1. An <a> tag with internal href
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      if (link) {
        const href = link.getAttribute('href');
        if (!href) return;
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.target === '_blank') return;
        const targetPath = href.split('#')[0].split('?')[0];
        if (targetPath === window.location.pathname) return;

        // Show loader immediately
        setIsNavigating(true);
        if (navTimer.current) clearTimeout(navTimer.current);
        navTimer.current = setTimeout(() => setIsNavigating(false), 10000);
        return;
      }

      // 2. A div/button with role="link" or role="button" or className
      //    containing "card" — these use onClick + router.push
      const clickable = target.closest('[role="button"], [role="link"], .v-course-card, .v-service-card, .v-project-showcase-card');
      if (clickable) {
        // Show loader immediately — router.push was likely called
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
