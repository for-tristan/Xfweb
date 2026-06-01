'use client';
import { useEffect, useRef, useCallback, ReactNode } from 'react';

// =============================================
// SCROLL REVEAL OBSERVER HOOK
// Uses IntersectionObserver + CSS transitions
// Animations replay when scrolling back and forth
// =============================================

function useRevealOnScroll(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
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

// =============================================
// SECTION REVEAL — Fade + Slide via CSS
// =============================================
export function SectionReveal({ children, direction = 'up', delay = 0, className = '' }: {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Map direction to CSS class
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

// =============================================
// STAGGER REVEAL — Children animate one by one
// =============================================
export function StaggerReveal({ children, className = '', staggerDelay = 80, direction = 'up' }: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: 'up' | 'left' | 'scale';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
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

// =============================================
// SCROLL PROGRESS BAR — Top of page
// =============================================
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (barRef.current) barRef.current.style.width = `${progress}%`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '3px', zIndex: 9999, background: 'transparent' }}>
      <div ref={barRef} style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))', transition: 'none' }} />
    </div>
  );
}

// =============================================
// PARALLAX LAYER — Smooth scroll-linked movement
// =============================================
export function ParallaxLayer({ children, speed = 0.3, className = '' }: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const offset = (centerY - viewportCenter) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);
  return <div ref={ref} className={className} style={{ willChange: 'transform' }}>{children}</div>;
}

// =============================================
// TEXT SPLIT ANIMATION — Character-by-character reveal
// =============================================
export function TextSplitReveal({ text, className = '', tag = 'h2', delay = 0 }: {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = text.split('').map((char, i) =>
      char === ' '
        ? `<span style="display:inline-block;width:0.3em;opacity:0;transform:translate3d(50px,0,0);transition:opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay + i * 30}ms,transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay + i * 30}ms">&nbsp;</span>`
        : `<span style="display:inline-block;opacity:0;transform:translate3d(50px,0,0);transition:opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay + i * 30}ms,transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay + i * 30}ms">${char}</span>`
    ).join('');
    el.innerHTML = chars;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const spans = el.querySelectorAll('span');
        if (entry.isIntersecting) {
          spans.forEach(s => {
            (s as HTMLElement).style.opacity = '1';
            (s as HTMLElement).style.transform = 'translate3d(0,0,0)';
          });
        } else {
          spans.forEach((s, i) => {
            (s as HTMLElement).style.opacity = '0';
            (s as HTMLElement).style.transform = 'translate3d(50px,0,0)';
          });
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [text, delay]);
  const Tag = tag as React.ElementType;
  return <Tag ref={ref} className={className} />;
}

// =============================================
// COUNTER ANIMATION — Numbers count up on scroll
// =============================================
export function CounterAnimation({ target, suffix = '', className = '' }: {
  target: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          const duration = 2000;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out expo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            if (el) el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, suffix]);
  return <span ref={ref} className={className}>0{suffix}</span>;
}

// =============================================
// MAGNETIC BUTTON — Moves toward cursor on hover
// =============================================
export function MagneticButton({ children, className = '', strength = 0.3, onClick }: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translateX(${x * strength}px) translateY(${y * strength}px)`;
  }, [strength]);
  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translateX(0) translateY(0)';
    el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => { if (el) el.style.transition = ''; }, 500);
  }, []);
  return (
    <button ref={ref} className={className} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={onClick}>
      {children}
    </button>
  );
}

// =============================================
// TILT CARD — 3D tilt on hover
// =============================================
export function TiltCard({ children, className = '', glare = true }: {
  children: React.ReactNode;
  className?: string;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -15;
    const tiltY = (x - 0.5) * 15;
    el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02,1.02,1.02)`;
    if (glare) {
      el.style.setProperty('--glare-x', `${x * 100}%`);
      el.style.setProperty('--glare-y', `${y * 100}%`);
    }
  }, [glare]);
  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }, []);
  return (
    <div ref={ref} className={`v-card tilt-card ${className}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
      {glare && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          background: `radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.08), transparent 60%)`,
          opacity: 0, transition: 'opacity 0.3s',
        }} />
      )}
      {children}
    </div>
  );
}

// =============================================
// GLOW BUTTON — Neon glow effect
// =============================================
export function GlowButton({ children, className = '', onClick }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button className={`glow-btn ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

// =============================================
// FLOATING PARTICLES — CSS-animated background particles
// =============================================
export function FloatingParticles({ count = 20, className = '' }: {
  count?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 4 + 2;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const dur = Math.random() * 6 + 4;
      const delay = Math.random() * 4;
      particle.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        background:var(--accent);
        border-radius:50%;
        opacity:${Math.random() * 0.3 + 0.05};
        left:${x}%;top:${y}%;
        animation:floatParticle ${dur}s ease-in-out ${delay}s infinite alternate;
        pointer-events:none;
      `;
      el.appendChild(particle);
    }
  }, [count]);
  return <div ref={ref} className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} />;
}

// =============================================
// MORPHING SHAPE — SVG blob background decoration
// =============================================
export function MorphingShape({ className = '' }: { className?: string }) {
  return (
    <div className={`morphing-shape ${className}`} style={{ opacity: 0.06 }}>
      <svg viewBox="0 0 500 500" style={{ width: '100%', height: '100%' }}>
        <path fill="var(--accent)">
          <animate attributeName="d"
            values="M440,320Q430,390,380,430Q330,470,270,450Q210,430,150,410Q90,390,70,330Q50,270,60,210Q70,150,120,110Q170,70,230,60Q290,50,340,80Q390,110,420,170Q450,230,440,320Z;
                    M450,300Q460,370,400,420Q340,470,270,460Q200,450,140,420Q80,390,60,320Q40,250,70,180Q100,110,170,80Q240,50,310,70Q380,90,420,160Q460,230,450,300Z;
                    M430,310Q440,380,390,430Q340,480,270,460Q200,440,150,400Q100,360,80,290Q60,220,90,160Q120,100,190,70Q260,40,330,70Q400,100,430,170Q460,240,430,310Z;
                    M440,320Q430,390,380,430Q330,470,270,450Q210,430,150,410Q90,390,70,330Q50,270,60,210Q70,150,120,110Q170,70,230,60Q290,50,340,80Q390,110,420,170Q450,230,440,320Z"
            dur="12s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}
