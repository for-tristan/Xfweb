'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Skip Lenis on touch devices — native momentum scrolling is smoother
    // and less battery-intensive than JS-driven smoothing on mobile.
    // Also skip if user prefers reduced motion.
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
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

    lenisRef.current = lenis;

    lenis.on('scroll', () => {
      window.dispatchEvent(new CustomEvent('xf:lenis-scroll'));
    });

    (window as unknown as Record<string, unknown>).__lenis = lenis;

    return () => {
      lenis.destroy();
      (window as unknown as Record<string, unknown>).__lenis = null;
    };
  }, []);

  return <>{children}</>;
}
