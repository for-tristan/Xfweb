'use client';

/**
 * BlurText — character-by-character reveal animation (Vaulta SplitText style).
 *
 * Reveals once on scroll into view. Does NOT re-hide on scroll away to
 * prevent lag spikes. Uses opacity + translateY only (no filter:blur) to
 * avoid the "flying letters" repaint cost when nested inside transformed
 * parents (SectionReveal / ScrollFadeSection).
 */

import { useEffect, useRef, useState } from 'react';

interface BlurTextProps {
  text: string;
  tag?: string;
  className?: string;
  stagger?: number;
}

export function BlurText({
  text,
  tag = 'span',
  className = '',
  stagger = 0.012,
}: BlurTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chars = text.split('').map((char, i) => (
    <span
      key={i}
      className={`blur-char${char === ' ' ? ' space' : ''}`}
      style={revealed ? { transitionDelay: `${i * stagger}s` } : undefined}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  const El = tag as any;
  return (
    <El
      ref={ref}
      className={`blur-text${revealed ? ' revealed' : ''} ${className}`}
      style={{ contain: 'layout paint' }}
    >
      {chars}
    </El>
  );
}

export default BlurText;
