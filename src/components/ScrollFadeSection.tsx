'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ScrollFadeSectionProps {
  children: React.ReactNode;
  pin?: boolean;
  fadeDistance?: string;
  zIndex?: number;
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

  const currentRef = useRef({ opacity: 1, scale: 1 });
  const targetRef = useRef({ opacity: 1, scale: 1 });
  const pinStateRef = useRef<PinState>('unpinned');
  const fadePxRef = useRef(0);
  const innerHeightRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const fadeVh = parseFloat(fadeDistance) || 80;

  const updateTarget = () => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    if (!pin) {
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

    const rect = container.getBoundingClientRect();
    const innerHeight = innerHeightRef.current || inner.offsetHeight;
    const fadePx = fadePxRef.current;

    let state: PinState;
    let progress = 0;

    if (rect.top > 0) {
      state = 'unpinned';
      progress = 0;
    } else if (rect.bottom < innerHeight) {
      state = 'past';
      progress = 1;
    } else {
      state = 'pinned';
      const scrolledPast = -rect.top;
      progress = Math.min(1, scrolledPast / fadePx);
    }

    pinStateRef.current = state;

    targetRef.current = {
      opacity: 1 - progress,
      scale: 1 - progress * 0.04,
    };

    if (state === 'pinned') {
      inner.style.position = 'fixed';
      inner.style.top = '0';
      inner.style.left = '0';
      inner.style.width = '100%';
      inner.style.bottom = '';
      inner.style.visibility = 'visible';
    } else if (state === 'past') {
      inner.style.position = 'relative';
      inner.style.top = '';
      inner.style.left = '';
      inner.style.width = '';
      inner.style.bottom = '';
      inner.style.visibility = 'hidden';
      inner.style.opacity = '0';
      inner.style.transform = 'scale(0.96) translateZ(0)';
    } else {
      inner.style.position = 'relative';
      inner.style.top = '';
      inner.style.left = '';
      inner.style.width = '';
      inner.style.bottom = '';
      inner.style.visibility = 'visible';
    }
  };

  const measureAndSetHeight = () => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    if (pin) {
      const windowH = window.innerHeight;
      const fadePx = windowH * (fadeVh / 100);
      fadePxRef.current = fadePx;

      const prevPosition = inner.style.position;
      const prevTop = inner.style.top;
      const prevLeft = inner.style.left;
      const prevWidth = inner.style.width;
      const prevBottom = inner.style.bottom;
      const prevVisibility = inner.style.visibility;
      const prevOpacity = inner.style.opacity;
      const prevTransform = inner.style.transform;

      inner.style.position = 'relative';
      inner.style.top = '';
      inner.style.left = '';
      inner.style.width = '';
      inner.style.bottom = '';
      inner.style.visibility = 'visible';
      inner.style.opacity = '1';
      inner.style.transform = '';

      const contentHeight = inner.offsetHeight;
      innerHeightRef.current = contentHeight;
      container.style.height = `${contentHeight + fadePx}px`;

      inner.style.position = prevPosition;
      inner.style.top = prevTop;
      inner.style.left = prevLeft;
      inner.style.width = prevWidth;
      inner.style.bottom = prevBottom;
      inner.style.visibility = prevVisibility;
      inner.style.opacity = prevOpacity;
      inner.style.transform = prevTransform;
    } else {
      container.style.height = '';
    }
  };

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

      const pinState = pinStateRef.current;
      if (cur.opacity < 0.01 || pinState === 'past') {
        inner.style.visibility = 'hidden';
      } else {
        inner.style.visibility = 'visible';
        inner.style.opacity = String(cur.opacity);
        inner.style.transform = `scale(${cur.scale}) translateZ(0)`;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, fadeVh, startAnimation]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        zIndex,
      }}
    >
      <div
        ref={innerRef}
        style={{
          willChange: 'opacity, transform',
          backfaceVisibility: 'hidden',
          ...(pin ? {
            position: 'relative',
            zIndex,
            background: 'var(--black)',
            minHeight: '100vh',
            transform: 'translateZ(0)',
          } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
