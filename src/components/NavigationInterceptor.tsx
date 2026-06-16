'use client';

import { useEffect } from 'react';


export default function NavigationInterceptor() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
      if (href.startsWith('#')) return;
      if (href === window.location.pathname) return;

      window.dispatchEvent(new CustomEvent('xf:navigation-start'));
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
