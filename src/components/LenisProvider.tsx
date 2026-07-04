'use client';

import { useEffect } from 'react';

/**
 * LenisProvider — JS-driven smooth scroll for non-Firefox browsers only.
 *
 * WHY FIREFOX IS EXCLUDED:
 * Firefox re-renders position:fixed/sticky elements asynchronously during
 * scroll, which causes 1-frame visual jumps when Lenis's rAF-driven scroll
 * animation is active. Chrome/Edge/Safari handle this on their compositor
 * thread and don't have this issue.
 *
 * Firefox's native scroll is already smooth (Firefox has excellent native
 * smooth scrolling), so Firefox doesn't need Lenis. Excluding Firefox means:
 *   - Chrome/Edge/Safari: get Lenis smooth scroll ✅
 *   - Firefox: gets native scroll (already smooth) + no jumps ✅
 *
 * Touch devices and prefers-reduced-motion also skip Lenis entirely.
 *
 * The hero pin uses position:sticky (set once, never switched by JS), which
 * works perfectly with Lenis on non-Firefox browsers.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skip on touch devices — native momentum scrolling is smoother on mobile.
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    // Skip if user prefers reduced motion.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Skip on Firefox — Firefox has async fixed/sticky re-rendering that
    // causes jumps with Lenis's rAF-driven scroll. Firefox's native scroll
    // is already smooth, so it doesn't need Lenis.
    const isFirefox = typeof navigator !== 'undefined' && /Firefox/i.test(navigator.userAgent);
    if (isFirefox) return;

    // Initialize Lenis for Chrome, Edge, Safari, and other browsers.
    (async () => {
      const Lenis = (await import('lenis')).default;
      const lenis = new Lenis({
        duration: 1.0,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        touchMultiplier: 2,
        autoRaf: true, // Lenis manages its own rAF — stops when idle
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
