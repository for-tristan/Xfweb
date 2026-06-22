'use client';

import { useEffect, useRef } from 'react';

/**
 * AuroraBackground — drifting blurred orbs + a mouse-reactive spotlight.
 *
 * Design goals:
 *  - Calm "premium 2026" ambient background (Linear / Arc / Vercel vibe)
 *  - Mouse reactivity without being noisy: a soft spotlight follows the
 *    cursor, and the orbs parallax-shift toward it slightly
 *  - Cheap: orbs animate via CSS keyframes (GPU-composited transforms),
 *    so the only rAF work is lerping a couple of CSS variables per frame
 *  - Theme-aware: reads --accent / --accent-dark from :root, so it
 *    automatically matches whatever theme is active
 *  - Polite: respects prefers-reduced-motion, skips on very low-end
 *    devices, pauses when the tab is hidden or the user is idle
 *
 * Canvas/divs have pointer-events: none so all clicks pass through.
 */

const IDLE_TIMEOUT_MS = 4000;

/**
 * Decide what to render based on device capabilities.
 *  - 'skip': render nothing (reduced motion, save-data, very low-end)
 *  - 'static': render the orbs but freeze them (no animation, no mouse)
 *  - 'full': everything
 */
function getDeviceTier(): 'skip' | 'static' | 'full' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'full';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as any).connection?.saveData === true;
  const cores = navigator.hardwareConcurrency || 4;

  if (reduceMotion || saveData || cores <= 2) return 'skip';
  return 'full';
}

export default function AuroraBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tier = getDeviceTier();
    if (tier === 'skip') return;

    const root = rootRef.current;
    if (!root) return;

    // ── Mouse tracking with lerp smoothing ──────────────────────────────
    // Target = where the cursor actually is. Current = where the spotlight
    // is rendered. We lerp current → target each frame so the spotlight
    // glides instead of snapping, and the orbs parallax gently.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    let hasMouse = false;

    const onPointerMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      hasMouse = true;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // ── Animation loop ──────────────────────────────────────────────────
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
      idleTimer = setTimeout(stopLoop, IDLE_TIMEOUT_MS);
    };

    const animate = () => {
      if (!running) return;
      // Lerp factor — low value = slow, smooth glide. ~0.08 feels
      // like the spotlight is "following" the cursor rather than stuck to it.
      const lerp = 0.08;
      current.x += (target.x - current.x) * lerp;
      current.y += (target.y - current.y) * lerp;

      // Normalize to 0..1 for CSS
      const nx = current.x / window.innerWidth;
      const ny = current.y / window.innerHeight;

      // Drive the spotlight directly via CSS vars
      root.style.setProperty('--aurora-mx', `${(nx * 100).toFixed(2)}%`);
      root.style.setProperty('--aurora-my', `${(ny * 100).toFixed(2)}%`);

      // Parallax pull on orbs — each orb gets a different strength so
      // they don't move in lockstep. Range ±20px feels ambient, not jumpy.
      const pull1x = (nx - 0.5) * 40;
      const pull1y = (ny - 0.5) * 40;
      const pull2x = (nx - 0.5) * -28;
      const pull2y = (ny - 0.5) * -28;
      const pull3x = (nx - 0.5) * 20;
      const pull3y = (ny - 0.5) * -32;
      root.style.setProperty('--aurora-pull-1-x', `${pull1x.toFixed(1)}px`);
      root.style.setProperty('--aurora-pull-1-y', `${pull1y.toFixed(1)}px`);
      root.style.setProperty('--aurora-pull-2-x', `${pull2x.toFixed(1)}px`);
      root.style.setProperty('--aurora-pull-2-y', `${pull2y.toFixed(1)}px`);
      root.style.setProperty('--aurora-pull-3-x', `${pull3x.toFixed(1)}px`);
      root.style.setProperty('--aurora-pull-3-y', `${pull3y.toFixed(1)}px`);

      rafRef.current = requestAnimationFrame(animate);
    };

    // Kick off: if the user never moves the mouse, we still want the
    // spotlight to sit centered, so run one frame immediately.
    if (tier === 'full') {
      startLoop();
      scheduleIdleStop();
    } else {
      // Static tier: paint one frame so vars are set, then stop.
      current.x = target.x;
      current.y = target.y;
      root.style.setProperty('--aurora-mx', '50%');
      root.style.setProperty('--aurora-my', '50%');
    }

    // Resume on user activity, reset idle timer
    const onUserActivity = () => {
      if (tier === 'full') {
        startLoop();
        scheduleIdleStop();
      }
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

    // Tab visibility
    const onVisibility = () => {
      if (document.hidden) {
        if (idleTimer) clearTimeout(idleTimer);
        stopLoop();
      } else if (tier === 'full') {
        startLoop();
        scheduleIdleStop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      stopLoop();
      window.removeEventListener('pointermove', onPointerMove);
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, onUserActivity)
      );
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div ref={rootRef} className="aurora-bg" aria-hidden="true">
      {/* Drifting color orbs */}
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />
      {/* Mouse-reactive spotlight */}
      <div className="aurora-spotlight" />
      {/* Subtle grain for texture */}
      <div className="aurora-grain" />
    </div>
  );
}
