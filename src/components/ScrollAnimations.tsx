'use client';
import { useEffect, useRef, useCallback, ReactNode } from 'react';

// Firefox detection — skip ALL scroll-based reveal animations on Firefox.
// Firefox's compositor can't handle the IntersectionObserver + transform
// combination without main-thread reflow = scroll jumps. Elements are
// visible by default (no .reveal class = no transform = no animation).
const isFirefox = typeof navigator !== 'undefined' && /Firefox/i.test(navigator.userAgent);

function useRevealOnScroll(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isFirefox) return; // Skip on Firefox
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
        } else {
          el.classList.remove('visible');
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

export function SectionReveal({ children, direction = 'up', delay = 0, className = '' }: {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isFirefox) return; // Skip on Firefox — no reveal class, no observer
    const el = ref.current;
    if (!el) return;
    const dirClass = direction === 'down' ? 'reveal-up' : `reveal-${direction}`;
    el.classList.add(dirClass);
    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
        } else {
          el.classList.remove('visible');
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [direction, delay]);
  return <div ref={ref} className={className}>{children}</div>;
}

export function StaggerReveal({ children, className = '', staggerDelay = 80, direction = 'up' }: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: 'up' | 'left' | 'scale';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isFirefox) return; // Skip on Firefox — no reveal class, no observer
    const el = ref.current;
    if (!el) return;
    const dirClass = direction === 'left' ? 'reveal-left' : direction === 'scale' ? 'reveal-scale' : 'reveal-up';
    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      child.classList.add(dirClass);
      child.style.transitionDelay = `${i * staggerDelay}ms`;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < children.length; i++) {
            (children[i] as HTMLElement).classList.add('visible');
          }
        } else {
          for (let i = 0; i < children.length; i++) {
            (children[i] as HTMLElement).classList.remove('visible');
          }
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [staggerDelay, direction]);
  return <div ref={ref} className={className}>{children}</div>;
}

export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return; // throttle to one rAF per frame
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (barRef.current) barRef.current.style.width = `${progress}%`;
        rafId = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '3px', zIndex: 9999, background: 'transparent' }}>
      <div ref={barRef} style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))', transition: 'none' }} />
    </div>
  );
}


