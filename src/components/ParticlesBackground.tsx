'use client';

import { useEffect, useRef } from 'react';

/**
 * ParticlesBackground — Pure canvas implementation.
 * Theme-dynamic: watches `data-theme` AND `class` attributes on <html>
 * and also listens for a custom 'xf-theme-change' event.
 * Determines particle color from the theme ID directly (no CSS variable lag).
 *
 * Canvas has pointer-events: none so all clicks pass through.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  opacityDir: number;
}

const LIGHT_THEMES = new Set([
  'light', 'sand', 'lavender', 'mint', 'rose-gold',
  'honey', 'clay', 'sage', 'peach',
]);

function isLightTheme(): boolean {
  const theme = document.documentElement.getAttribute('data-theme') || '';
  return LIGHT_THEMES.has(theme);
}

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const colorRef = useRef<string>('rgba(255,255,255,0.25)');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Derive color from theme attribute directly — no CSS variable lag
    const updateColor = () => {
      colorRef.current = isLightTheme()
        ? 'rgba(0,0,0,0.18)'
        : 'rgba(255,255,255,0.25)';
    };
    updateColor();

    // Watch for theme changes via MutationObserver
    // Watch both 'data-theme' attribute AND 'class' (toggles dark class)
    const observer = new MutationObserver(() => {
      // Use requestAnimationFrame to ensure style recalculation
      requestAnimationFrame(() => {
        updateColor();
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    // Also listen for custom event (dispatched by theme setters)
    const onCustomThemeChange = () => {
      requestAnimationFrame(() => {
        updateColor();
      });
    };
    window.addEventListener('xf-theme-change', onCustomThemeChange);

    // Also listen for storage events (in case theme changed in another component)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'x-foundry-theme') {
        requestAnimationFrame(() => {
          updateColor();
        });
      }
    };
    window.addEventListener('storage', onStorage);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const count = 160;
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: Math.random() * 2 + 1,
        opacity: Math.random(),
        opacityDir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    particlesRef.current = particles;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const color = colorRef.current;

      for (const p of particles) {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Animate opacity (subtle pulsing, capped lower)
        p.opacity += p.opacityDir * 0.004;
        if (p.opacity >= 0.6) { p.opacity = 0.6; p.opacityDir = -1; }
        if (p.opacity <= 0) { p.opacity = 0; p.opacityDir = 1; }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('xf-theme-change', onCustomThemeChange);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
