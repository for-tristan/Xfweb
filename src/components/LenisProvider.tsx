'use client';

import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';

/**
 * LenisProvider — DISABLED.
 *
 * Lenis (JS-driven smooth scroll) was causing the "frame by frame" scroll
 * jank across browsers. Modern browsers (Chrome, Firefox, Safari, Edge)
 * all have native GPU-accelerated smooth scrolling that's superior to
 * JS-based smoothing. Lenis intercepts scroll events and animates them
 * via requestAnimationFrame, which creates a stepped/layered feel when
 * the rAF loop isn't perfectly in sync with the display refresh rate.
 *
 * The component is kept (not deleted) so we can re-enable Lenis easily
 * if needed — just uncomment the initialization block below. All other
 * scroll-dependent components (ScrollFadeSection, ScrollProgressBar,
 * checkReveals) listen to native scroll events, which work fine without
 * Lenis.
 *
 * The `prevent` config (for modals, dialogs, etc.) is no longer needed
 * because native scroll doesn't need to be "prevented" inside modals —
 * CSS `overscroll-behavior: contain` handles that.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const _lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Lenis disabled — native browser scroll is smoother and more reliable.
    // To re-enable, uncomment the block below:
    //
    // const isTouch = window.matchMedia('(pointer: coarse)').matches;
    // const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // if (isTouch || prefersReducedMotion) return;
    //
    // const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    // _lenisRef.current = lenis;
    // (window as unknown as Record<string, unknown>).__lenis = lenis;
    // return () => { lenis.destroy(); (window as unknown as Record<string, unknown>).__lenis = null; };
  }, []);

  return <>{children}</>;
}
