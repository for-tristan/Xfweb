'use client';

import { useEffect } from 'react';

/**
 * LenisProvider — JS-driven smooth scroll for non-Firefox browsers only.
 *
 * Firefox is excluded because its async re-rendering of position:fixed
 * elements during Lenis's rAF-driven scroll causes visible jumps. The
 * feedback loop (JS reads rect → sets position:fixed → doc height changes
 * → rect changes → repeat) cannot be broken on Firefox.
 *
 * Firefox's native scroll is already smooth, so it doesn't need Lenis.
 * The hero pin uses position:fixed (original 3-state logic) which works
 * perfectly with Firefox's native scroll.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    // Skip on Firefox — native scroll is smooth, avoids the fixed-element
    // re-render feedback loop with Lenis.
    const isFirefox = typeof navigator !== 'undefined' && /Firefox/i.test(navigator.userAgent);
    if (isFirefox) return;

    (async () => {
      const Lenis = (await import('lenis')).default;
      const lenis = new Lenis({
        duration: 1.0,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        touchMultiplier: 2,
        autoRaf: true,
        prevent: (node: EventTarget | null) => {
          if (!(node instanceof HTMLElement)) return false;
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

      (window as unknown as Record<string, unknown>).__lenis = lenis;

      return () => {
        lenis.destroy();
        (window as unknown as Record<string, unknown>).__lenis = null;
      };
    })();
  }, []);

  return <>{children}</>;
}
