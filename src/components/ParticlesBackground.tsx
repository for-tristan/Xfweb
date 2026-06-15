'use client';

import { useEffect, useRef } from 'react';

/**
 * ParticlesBackground — Pure canvas implementation.
 * Theme-dynamic: reads the --accent CSS variable every frame
 * so particle color automatically matches the current theme.
 * Caches the result and only recalculates when data-theme changes.
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

/**
 * Parse a hex color string into RGB components.
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '');
  if (h.length < 6) return null;
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

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

    // Cache: only recalculate color when theme attribute changes
    let lastTheme: string | null = '__UNINIT__';
    let particleR = 255;
    let particleG = 255;
    let particleB = 255;
    let particleAlpha = 0.25; // for dark bg
    let colorDirty = true;

    const recalcColor = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme') || '';
      const isLight = LIGHT_THEMES.has(themeAttr);

      // Read --accent from computed styles (updated by CSS when data-theme changes)
      const accentRaw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const rgb = hexToRgb(accentRaw);

      if (rgb) {
        // Use the theme's accent color at low opacity
        particleR = rgb[0];
        particleG = rgb[1];
        particleB = rgb[2];
      } else {
        // Fallback: white on dark, dark on light
        if (isLight) {
          particleR = 0; particleG = 0; particleB = 0;
        } else {
          particleR = 255; particleG = 255; particleB = 255;
        }
      }

      // Alpha per theme type — light themes need higher alpha since bg is bright
      particleAlpha = isLight ? 0.35 : 0.3;

      colorDirty = true;
      lastTheme = themeAttr;
    };

    const animate = () => {
      // Check if theme changed — recalc color only when needed
      const currentTheme = document.documentElement.getAttribute('data-theme') || '';
      if (currentTheme !== lastTheme) {
        recalcColor();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const r = particleR;
      const g = particleG;
      const b = particleB;
      const a = particleAlpha;

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
        p.opacity += p.opacityDir * 0.005;
        if (p.opacity >= 0.8) { p.opacity = 0.8; p.opacityDir = -1; }
        if (p.opacity <= 0) { p.opacity = 0; p.opacityDir = 1; }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
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
