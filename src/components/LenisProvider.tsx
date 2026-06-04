'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
      // Prevent Lenis from hijacking scroll inside these elements
      prevent: (node: EventTarget | null) => {
        if (!(node instanceof HTMLElement)) return false;
        // Don't intercept scroll if the target is inside an element
        // that should handle its own scrolling
        return !!(
          node.closest('[data-lenis-prevent]') ||
          node.closest('.zai-chat-page') ||
          node.closest('.dashboard-modal-overlay') ||
          node.closest('.dashboard-modal') ||
          node.closest('.search-modal-overlay') ||
          node.closest('.confirm-modal-overlay') ||
          node.closest('.chat-modal-overlay') ||
          node.closest('.v-auth-modal') ||
          node.closest('[data-radix-popper-content-wrapper]') ||
          node.closest('[data-state="open"]') ||
          node.closest('.v-theme-picker-panel') ||
          node.closest('dialog') ||
          node.closest('[role="dialog"]') ||
          node.closest('.staggered-menu-panel') ||
          node.closest('.sm-scope')
        );
      },
    });

    lenisRef.current = lenis;

    // Fire a custom event on each Lenis scroll frame so that
    // ScrollFadeSection and other scroll-linked components can
    // update their positions in sync with Lenis' smooth scroll.
    lenis.on('scroll', () => {
      window.dispatchEvent(new CustomEvent('xf:lenis-scroll'));
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Expose lenis instance globally so other components can use it
    (window as unknown as Record<string, unknown>).__lenis = lenis;

    return () => {
      lenis.destroy();
      (window as unknown as Record<string, unknown>).__lenis = null;
    };
  }, []);

  return <>{children}</>;
}
