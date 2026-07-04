'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * LenisProvider — JS-driven smooth scroll for all browsers.
 *
 * RE-ENABLED for Firefox now that the ScrollFadeSection pin uses GPU
 * compositing hints (translateZ(0) + backface-visibility:hidden) that
 * force Firefox to render the pinned element on its compositor thread.
 * This eliminates the async re-render jumps that previously conflicted
 * with Lenis's rAF-driven scroll animation.
 *
 * Skipped for:
 *  - Touch devices (native momentum scrolling is better on mobile)
 *  - prefers-reduced-motion (accessibility)
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

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
  }, []);

  return <>{children}</>;
}
