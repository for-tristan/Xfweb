'use client';

import { useEffect, useRef } from 'react';

/**
 * ParticlesBackground — Pure canvas implementation.
 * Theme-dynamic: checks data-theme attribute on EVERY frame
 * so there is zero lag and zero missed updates.
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

// Color for dark backgrounds — subtle white
const DARK_BG_COLOR = 'rgba(255,255,255,0.22)';
// Color for light backgrounds — subtle dark
const LIGHT_BG_COLOR = 'rgba(0,0,0,0.15)';

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Cache last known theme to avoid string ops on every single particle
    let lastTheme: string | null = null;
    let currentColor = DARK_BG_COLOR;

    const animate = () => {
      // Check theme on every frame — getAttribute is extremely cheap
      const themeAttr = document.documentElement.getAttribute('data-theme');
      if (themeAttr !== lastTheme) {
        lastTheme = themeAttr;
        currentColor = LIGHT_THEMES.has(themeAttr || '') ? LIGHT_BG_COLOR : DARK_BG_COLOR;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Animate opacity (subtle pulsing)
        p.opacity += p.opacityDir * 0.004;
        if (p.opacity >= 0.6) { p.opacity = 0.6; p.opacityDir = -1; }
        if (p.opacity <= 0) { p.opacity = 0; p.opacityDir = 1; }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = currentColor;
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
