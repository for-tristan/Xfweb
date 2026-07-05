'use client';

/**
 * Throttle a scroll/resize event handler to one execution per animation frame.
 *
 * Usage:
 *   const onScroll = rafThrottle(() => { ... });
 *   window.addEventListener('scroll', onScroll, { passive: true });
 *   // later:
 *   onScroll.cancel();
 */

export function rafThrottle<T extends (...args: any[]) => void>(fn: T): T & { cancel: () => void } {
  let rafId: number | null = null;
  let lastArgs: any[] = [];

  const throttled = (...args: any[]) => {
    lastArgs = args;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      fn(...lastArgs);
    });
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled as T & { cancel: () => void };
}
