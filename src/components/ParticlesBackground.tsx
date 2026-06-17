'use client';

import { useEffect, useRef } from 'react';

/**
 * ParticlesBackground — Pure canvas implementation.
 * Theme-dynamic: reads the --accent CSS variable every frame
 * so particle color automatically matches the current theme.
 * Caches the result and only recalculates when data-theme changes.
 *
 * Canvas has pointer-events: none so all clicks pass through.
 *
 * Performance optimizations:
 *  - Particle count reduced from 160 → 70 (still feels alive, half the CPU)
 *  - Frame rate capped to ~30 FPS (every other rAF) — particles drift slowly
 *    so 30fps is visually identical to 60fps but halves the per-frame cost
 *  - Animation loop pauses when the tab is hidden (visibilitychange) so the
 *    rAF loop doesn't keep burning CPU in the background
 *  - Animation loop ALSO pauses when the user is idle (no input for 3s) —
 *    particles are decorative and don't need to keep moving when nobody is
 *    looking. Resumes on any pointer/scroll/keyboard activity.
 *  - Color recalculation only happens when data-theme actually changes
 *  - Reduces particle count on small screens (mobile / narrow viewports)
 *  - On low-end devices (≤4 logical cores or ≤4GB RAM), particle count is
 *    halved and the idle-pause threshold is raised to 1.5s.
 *  - On very low-end devices (≤2 cores OR save-data OR reduced-motion),
 *    particles are skipped entirely.
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

const IDLE_TIMEOUT_MS = 3000;
const LOW_END_IDLE_MS = 1500;

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

/**
 * Decide whether to skip particles entirely on this device.
 * Returns one of: 'skip' | 'minimal' | 'normal'
 */
function getDeviceTier(): 'skip' | 'minimal' | 'normal' {
  if (typeof navigator === 'undefined') return 'normal';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as any).connection?.saveData === true;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;

  if (reduceMotion || saveData || cores <= 2) return 'skip';
  if (cores <= 4 || memory <= 4) return 'minimal';
  return 'normal';
}

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tier = getDeviceTier();

    // Reduced-motion / very low-end: render nothing at all
    if (tier === 'skip') return;

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

    // Scale particle count down on small screens + low-end devices
    const w = window.innerWidth;
    const baseCount = w < 768 ? 40 : w < 1280 ? 55 : 70;
    const count = tier === 'minimal' ? Math.floor(baseCount / 2) : baseCount;
    const idleMs = tier === 'minimal' ? LOW_END_IDLE_MS : IDLE_TIMEOUT_MS;

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        opacity: Math.random(),
        opacityDir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    // Cache: only recalculate color when theme attribute changes
    let lastTheme: string | null = '__UNINIT__';
    let particleR = 255;
    let particleG = 255;
    let particleB = 255;
    let particleAlpha = 0.25;

    const recalcColor = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme') || '';
      const isLight = LIGHT_THEMES.has(themeAttr);

      const accentRaw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const rgb = hexToRgb(accentRaw);

      if (rgb) {
        particleR = rgb[0];
        particleG = rgb[1];
        particleB = rgb[2];
      } else {
        if (isLight) {
          particleR = 0; particleG = 0; particleB = 0;
        } else {
          particleR = 255; particleG = 255; particleB = 255;
        }
      }

      particleAlpha = isLight ? 0.35 : 0.3;
      lastTheme = themeAttr;
    };

    const drawFrame = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || '';
      if (currentTheme !== lastTheme) recalcColor();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const r = particleR, g = particleG, b = particleB, a = particleAlpha;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
        p.opacity += p.opacityDir * 0.005;
        if (p.opacity >= 0.8) { p.opacity = 0.8; p.opacityDir = -1; }
        if (p.opacity <= 0) { p.opacity = 0; p.opacityDir = 1; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    // ── Animation loop with FPS cap + tab-visibility pause + idle pause ──
    let frameSkip = false;
    let running = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const stopLoop = () => {
      if (!running) return;
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      rafRef.current = requestAnimationFrame(animate);
    };

    const scheduleIdleStop = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(stopLoop, idleMs);
    };

    const animate = () => {
      if (!running) return;
      // FPS cap: only render every other frame
      if (frameSkip) {
        frameSkip = false;
      } else {
        frameSkip = true;
        drawFrame();
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    // Kick off on mount, then auto-pause after idleMs of inactivity
    startLoop();
    scheduleIdleStop();

    // Resume loop on any user activity, then reset idle timer
    const onUserActivity = () => {
      startLoop();
      scheduleIdleStop();
    };
    const activityEvents: Array<keyof WindowEventMap> = [
      'pointermove',
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
      'wheel',
    ];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, onUserActivity, { passive: true })
    );

    // Tab visibility: pause immediately when hidden, resume when visible + active
    const onVisibility = () => {
      if (document.hidden) {
        if (idleTimer) clearTimeout(idleTimer);
        stopLoop();
      } else {
        startLoop();
        scheduleIdleStop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      stopLoop();
      window.removeEventListener('resize', resize);
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, onUserActivity)
      );
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Render the canvas even if we end up skipping (tier=skip returns early
  // and never paints a frame, which is fine — canvas stays transparent).
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
