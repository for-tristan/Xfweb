'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * LenisProvider — smooth-scroll wrapper that DOESN'T burn a 60fps rAF loop
 * forever. The rAF loop only runs while scrolling is actually happening
 * (or for a short tail after the last input). When idle, the loop is
 * cancelled entirely so the browser can sleep the compositor.
 *
 * How it works:
 *  - On any wheel/touch/keydown/pointerdown/scroll event, we (re)start
 *    the rAF loop and reset an idle timer.
 *  - When the idle timer fires (default 400ms after last input), we
 *    cancel the rAF. Lenis keeps its internal state so the next input
 *    resumes seamlessly.
 *  - We also start the loop once on mount so anchor-link/smooth-scroll
 *    programmatic calls work.
 */
const IDLE_TIMEOUT_MS = 400;

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

    // ── Gated rAF loop: only runs while user is interacting ──
    let rafId: number | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let running = false;

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      running = false;
    };

    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(raf);
    };

    const scheduleStop = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(stopLoop, IDLE_TIMEOUT_MS);
    };

    const onUserInput = () => {
      startLoop();
      scheduleStop();
    };

    // Kick off once on mount so programmatic smooth-scrolls work
    startLoop();
    scheduleStop();

    // Listen for any input that might cause scrolling
    const inputEvents: Array<keyof WindowEventMap> = [
      'wheel',
      'touchstart',
      'touchmove',
      'keydown',
      'pointerdown',
    ];
    inputEvents.forEach((evt) =>
      window.addEventListener(evt, onUserInput, { passive: true })
    );

    // Custom event so other code can request the loop to wake
    // (e.g. before calling lenis.scrollTo)
    const onWake = () => {
      startLoop();
      scheduleStop();
    };
    window.addEventListener('xf:lenis-wake', onWake);

    (window as unknown as Record<string, unknown>).__lenis = lenis;

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      stopLoop();
      inputEvents.forEach((evt) =>
        window.removeEventListener(evt, onUserInput)
      );
      window.removeEventListener('xf:lenis-wake', onWake);
      lenis.destroy();
      (window as unknown as Record<string, unknown>).__lenis = null;
    };
  }, []);

  return <>{children}</>;
}
