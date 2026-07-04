'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * LenisProvider — JS-driven smooth scroll.
 *
 * RE-ENABLED after the backdrop-filter GPU bottleneck was removed.
 * The frame-by-frame scroll jank was caused by 12+ cards with
 * backdrop-filter: blur(16px) forcing GPU re-rasterization every frame,
 * NOT by Lenis. With that fixed, Lenis should run smoothly.
 *
 * If jank returns, disable Lenis again — the native browser scroll is
 * always a safe fallback.
 */

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Skip on touch devices — native momentum scrolling is smoother
    // and less battery-intensive than JS-driven smoothing on mobile.
    // Also skip if user prefers reduced motion.
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    const lenis = new Lenis({
      // Slightly shorter duration (1.2 → 1.0) for a less "floaty" feel
      // and faster response to scroll input.
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
      // autoRaf lets Lenis manage its own requestAnimationFrame loop.
      // It starts on scroll input and stops when the scroll settles,
      // so there's no idle CPU drain.
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

    lenisRef.current = lenis;

    (window as unknown as Record<string, unknown>).__lenis = lenis;

    return () => {
      lenis.destroy();
      (window as unknown as Record<string, unknown>).__lenis = null;
    };
  }, []);

  return <>{children}</>;
}
