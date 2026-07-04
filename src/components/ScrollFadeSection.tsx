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

  const currentRef = useRef({ opacity: 1, scale: 1 });
  const targetRef = useRef({ opacity: 1, scale: 1 });
  const rafRef = useRef<number | null>(null);
  const fadePxRef = useRef(0);

  const fadeVh = parseFloat(fadeDistance) || 80;

  /**
   * STICKY-BASED PINNING (no more position: fixed switching).
   *
   * The inner element uses CSS `position: sticky; top: 0` which keeps it
   * in document flow while pinning it to the viewport. This means:
   *   - NO document height change when pinning (no scroll jumps!)
   *   - NO position switching (relative → fixed → relative)
   *   - Works perfectly with Lenis smooth scroll
   *   - GPU-accelerated by the browser
   *
   * The container is given extra height (content + fade distance) so
   * there's scroll room for the fade. The inner element sticks at top:0
   * until the container scrolls past, then naturally scrolls away.
   *
   * We only need JS for the opacity/scale fade based on scroll progress.
   */
  const updateTarget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const fadePx = fadePxRef.current;
    const windowH = window.innerHeight;

    if (!pin) {
      // ── NON-PINNED: simple scroll-based fade ──
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

    // ── PINNED (sticky): calculate fade progress ──
    // With sticky, the inner element pins at top:0. As we scroll,
    // rect.top goes negative. The fade happens over the first fadePx
    // of scrolling past the container's natural top.
    const scrolledPast = Math.max(0, -rect.top);
    const progress = fadePx > 0 ? Math.min(1, scrolledPast / fadePx) : 0;

    targetRef.current = {
      opacity: 1 - progress,
      scale: 1 - progress * 0.04,
    };
  }, [pin]);

  /**
   * Measure and set the container height for the pin.
   * Container = inner content height + fade distance.
   * The inner element (sticky) pins at top:0 and stays there while
   * the container scrolls past.
   */
  const measureAndSetHeight = useCallback(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    if (pin) {
      const windowH = window.innerHeight;
      const fadePx = windowH * (fadeVh / 100);
      fadePxRef.current = fadePx;
      // Container height = content height + fade distance
      // The sticky inner stays at top:0 for the entire fade distance,
      // then scrolls away naturally.
      const contentHeight = inner.offsetHeight;
      container.style.height = `${contentHeight + fadePx}px`;
    } else {
      container.style.height = '';
    }
  }, [pin, fadeVh]);

  /**
   * On-demand animation — lerps visual values toward targets.
   * Only runs when targets differ from current values (no idle rAF loop).
   */
  const startAnimation = useCallback(() => {
    if (rafRef.current !== null) return;

    const animate = () => {
      const inner = innerRef.current;
      if (!inner) { rafRef.current = null; return; }

      const cur = currentRef.current;
      const tgt = targetRef.current;

      cur.opacity = lerp(cur.opacity, tgt.opacity, scrub);
      cur.scale = lerp(cur.scale, tgt.scale, scrub);

      const opacityDone = Math.abs(cur.opacity - tgt.opacity) < 0.001;
      const scaleDone = Math.abs(cur.scale - tgt.scale) < 0.0001;

      if (opacityDone) cur.opacity = tgt.opacity;
      if (scaleDone) cur.scale = tgt.scale;

      if (cur.opacity < 0.01) {
        inner.style.visibility = 'hidden';
      } else {
        inner.style.visibility = 'visible';
        inner.style.opacity = String(cur.opacity);
        inner.style.transform = `scale(${cur.scale})`;
      }

      if (opacityDone && scaleDone) {
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [scrub]);

  useEffect(() => {
    measureAndSetHeight();
    updateTarget();
    startAnimation();

    let scrollRaf: number | null = null;

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
  }, [pin, fadeVh, measureAndSetHeight, updateTarget, startAnimation]);

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
            // STICKY: pins at top:0 while container scrolls past.
            // This replaces the old position:fixed switching that
            // caused scroll jumps with Lenis. Sticky stays in document
            // flow, so no document height change = no jumps.
            position: 'sticky',
            top: 0,
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
