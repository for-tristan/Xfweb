'use client';

import { useEffect } from 'react';

/**
 * LenisProvider — PERMANENTLY DISABLED.
 *
 * Lenis (JS-driven smooth scroll) has been the root cause of the scroll
 * jumps across all browsers. Even after removing every other JS scroll
 * handler (ScrollFadeSection, ScrollProgressBar, checkReveals), the jumps
 * persisted because Lenis itself intercepts native scroll events and
 * re-animates them via requestAnimationFrame. This rAF-driven animation
 * can't sync perfectly with the browser's compositor, causing visible
 * stepping/jumping — especially when scrolling past sticky elements.
 *
 * Native browser scroll is GPU-accelerated, perfectly synced with the
 * compositor, and works flawlessly with position:sticky. There is no
 * benefit Lenis provides that outweighs this cost.
 *
 * This component is kept as a no-op wrapper (renders children directly)
 * so no other code needs to change. To re-enable Lenis in the future,
 * uncomment the initialization block below — but be warned: the jumps
 * will return.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Lenis disabled — native browser scroll is smoother and more reliable.
    // To re-enable (NOT recommended — causes scroll jumps):
    //
    // const Lenis = (await import('lenis')).default;
    // const lenis = new Lenis({ duration: 1.0, smoothWheel: true, autoRaf: true });
    // (window as unknown as Record<string, unknown>).__lenis = lenis;
    // return () => { lenis.destroy(); (window as unknown as Record<string, unknown>).__lenis = null; };
  }, []);

  return <>{children}</>;
}
