'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ScrollFadeSectionProps {
  children: React.ReactNode;
  /** Whether this section pins at the top while fading */
  pin?: boolean;
  /** Scroll distance for fade — percentage of viewport height (e.g. "100%") */
  fadeDistance?: string;
  /** Stacking order — higher values appear on top of earlier sections */
  zIndex?: number;
  /** Lerp smoothing factor (0–1). Lower = smoother. 0.08 ≈ GSAP scrub 0.6 */
  scrub?: number;
  className?: string;
}

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

type PinState = 'unpinned' | 'pinned' | 'past';

export default function ScrollFadeSection({
  children,
  pin = false,
  fadeDistance = '80%',
  zIndex = 1,
  scrub = 0.08,
  className = '',
}: ScrollFadeSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Lerp-smoothed current values
  // NOTE: `blur` is kept in state for API compatibility but is NOT applied as a
  // CSS filter every frame — animating `filter: blur()` forces the browser to
  // re-rasterize the entire layer on every frame and is the #1 cause of scroll
  // jank on this page. We instead apply a single static blur class on fade-out.
  const currentRef = useRef({ opacity: 1, scale: 1 });
  // Instant target values from scroll position
  const targetRef = useRef({ opacity: 1, scale: 1 });
  // Current pin state
  const pinStateRef = useRef<PinState>('unpinned');
  // The fade distance in pixels
  const fadePxRef = useRef(0);
  // Animation frame
  const rafRef = useRef<number | null>(null);

  const fadeVh = parseFloat(fadeDistance) || 80;

  /**
   * Update the pin state and target fade values based on scroll.
   * Called on scroll/resize. Does NOT apply styles — the animation loop does that.
   */
  const updateTarget = () => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    if (!pin) {
      // ── NON-PINNED: simple scroll-based fade ──
      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight;
      const fadeStart = windowH * 0.8;
      const fadeEnd = -(windowH * 0.3);
      const progress = 1 - (rect.top - fadeEnd) / (fadeStart - fadeEnd);
      const clamped = Math.max(0, Math.min(1, progress));
      const fadeOut = 1 - clamped;
      targetRef.current = {
        opacity: fadeOut,
        scale: 1 - (1 - fadeOut) * 0.04,
      };
      return;
    }

    // ── PINNED: position: fixed based pinning ──
    const rect = container.getBoundingClientRect();
    const innerHeight = inner.offsetHeight;
    const fadePx = fadePxRef.current;
    const windowH = window.innerHeight;

    let state: PinState;
    let progress = 0;

    if (rect.top > 0) {
      // Container hasn't reached the top yet — not pinned
      state = 'unpinned';
      progress = 0;
    } else if (rect.bottom < innerHeight) {
      // Container has scrolled past — content should be at its final position
      state = 'past';
      progress = 1;
    } else {
      // Container top is at/above viewport, bottom is still below — PIN
      state = 'pinned';
      const scrolledPast = -rect.top;
      progress = Math.min(1, scrolledPast / fadePx);
    }

    pinStateRef.current = state;

    targetRef.current = {
      opacity: 1 - progress,
      scale: 1 - progress * 0.04,
    };

    // Apply pin positioning immediately (no lerp — position must be exact)
    if (state === 'pinned') {
      inner.style.position = 'fixed';
      inner.style.top = '0';
      inner.style.left = '0';
      inner.style.width = '100%';
      inner.style.bottom = '';
    } else if (state === 'past') {
      // Stay fixed but hidden — do NOT switch to absolute+bottom,
      // which would reposition the hero at the bottom of the tall
      // container and cause it to "appear twice".
      inner.style.position = 'fixed';
      inner.style.top = '0';
      inner.style.left = '0';
      inner.style.width = '100%';
      inner.style.bottom = '';
      inner.style.visibility = 'hidden';
    } else {
      inner.style.position = 'relative';
      inner.style.top = '';
      inner.style.left = '';
      inner.style.width = '';
      inner.style.bottom = '';
    }
  };

  /**
   * Measure the inner content height and set the container height.
   * Container = content height + fade distance in px.
   * This creates the scroll room needed for the pin + fade.
   */
  const measureAndSetHeight = () => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    if (pin) {
      const windowH = window.innerHeight;
      const fadePx = windowH * (fadeVh / 100);
      fadePxRef.current = fadePx;

      // Temporarily switch to relative to measure true content height
      const prevPosition = inner.style.position;
      const prevTop = inner.style.top;
      const prevLeft = inner.style.left;
      const prevWidth = inner.style.width;
      const prevBottom = inner.style.bottom;

      inner.style.position = 'relative';
      inner.style.top = '';
      inner.style.left = '';
      inner.style.width = '';
      inner.style.bottom = '';

      const contentHeight = inner.offsetHeight;
      container.style.height = `${contentHeight + fadePx}px`;

      // Restore
      inner.style.position = prevPosition;
      inner.style.top = prevTop;
      inner.style.left = prevLeft;
      inner.style.width = prevWidth;
      inner.style.bottom = prevBottom;
    } else {
      container.style.height = '';
    }
  };

  /**
   * On-demand animation — lerps visual values toward targets.
   * Only runs when targets differ from current values (no idle rAF loop).
   */
  const startAnimation = useCallback(() => {
    if (rafRef.current !== null) return; // already running

    const animate = () => {
      const inner = innerRef.current;
      if (!inner) { rafRef.current = null; return; }

      const cur = currentRef.current;
      const tgt = targetRef.current;

      cur.opacity = lerp(cur.opacity, tgt.opacity, scrub);
      cur.scale = lerp(cur.scale, tgt.scale, scrub);

      // Snap values that are very close to target
      const opacityDone = Math.abs(cur.opacity - tgt.opacity) < 0.001;
      const scaleDone = Math.abs(cur.scale - tgt.scale) < 0.0001;

      if (opacityDone) cur.opacity = tgt.opacity;
      if (scaleDone) cur.scale = tgt.scale;

      const pinState = pinStateRef.current;
      if (cur.opacity < 0.01 || pinState === 'past') {
        inner.style.visibility = 'hidden';
      } else {
        inner.style.visibility = 'visible';
        inner.style.opacity = String(cur.opacity);
        inner.style.transform = `scale(${cur.scale})`;
        // NOTE: do NOT apply `filter: blur()` every frame — it forces a
        // re-rasterization of the whole layer and is the main cause of scroll
        // lag on this page. A subtle scale + opacity fade is enough visually.
      }

      // Stop the loop when all values have reached their targets
      if (opacityDone && scaleDone) {
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [scrub]);

  // Trigger animation on scroll/resize
  useEffect(() => {
    measureAndSetHeight();
    updateTarget();
    startAnimation();

    let scrollRaf: number | null = null;

    // Single scroll listener handles both native scroll and Lenis.
    // Lenis dispatches native scroll events, so a separate
    // 'xf:lenis-scroll' listener is redundant and causes double work.
    const onScroll = () => {
      if (scrollRaf !== null) return;
      scrollRaf = requestAnimationFrame(() => {
        updateTarget();
        startAnimation();
        scrollRaf = null;
      });
    };

    const onResize = () => {
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
      scrollRaf = null;
      measureAndSetHeight();
      updateTarget();
      startAnimation();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, fadeVh, startAnimation]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        zIndex,
        ...(pin ? { overflow: 'hidden' } : {}),
      }}
    >
      <div
        ref={innerRef}
        style={{
          willChange: 'opacity, transform',
          ...(pin ? {
            position: 'relative',
            zIndex,
            background: 'var(--black)',
            minHeight: '100vh',
          } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
