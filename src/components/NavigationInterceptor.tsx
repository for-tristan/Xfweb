'use client';

import { useEffect } from 'react';

// Listens for clicks on internal <a> and Next <Link> elements
// and dispatches a custom event so PageTransition can start
// its curtain animation before the route change completes.

export default function NavigationInterceptor() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Only intercept internal navigation (not hash links, external, or same page)
      if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
      if (href.startsWith('#')) return;
      if (href === window.location.pathname) return;

      // Dispatch custom event for PageTransition to pick up
      window.dispatchEvent(new CustomEvent('xf:navigation-start'));
    };

    document.addEventListener('click', handleClick, true); // capture phase
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null; // renders nothing
}
