import { useEffect } from 'react';

/**
 * Click Splash hook — Particle Burst on click only.
 * Custom cursor dot, magnetic snap, and hover detection removed.
 * Keeps the satisfying particle burst effect on click.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  el: HTMLDivElement;
}

export function useClickSplash() {
  useEffect(() => {
    // Skip on touch devices
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isTouchDevice = !hasHover || isCoarse;
    if (isTouchDevice) return;

    const particles: Particle[] = [];
    let particleContainer: HTMLDivElement | null = null;

    const createParticleContainer = () => {
      const container = document.createElement('div');
      container.className = 'cursor-particles';
      container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999997;overflow:hidden;';
      document.body.appendChild(container);
      particleContainer = container;
    };

    const spawnParticles = (x: number, y: number) => {
      if (!particleContainer) return;
      const count = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 1.5 + Math.random() * 3;
        const size = 2 + Math.random() * 4;
        const maxLife = 30 + Math.random() * 20;
        const el = document.createElement('div');
        el.className = 'cursor-particle';
        el.style.cssText = `
          position:absolute;
          width:${size}px;height:${size}px;
          border-radius:50%;
          pointer-events:none;
          will-change:transform,opacity;
          background:var(--accent);
        `;
        particleContainer.appendChild(el);
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: maxLife, maxLife, size, el });
      }
    };

    const updateParticles = () => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vy += 0.04;
        p.life--;
        const progress = p.life / p.maxLife;
        p.el.style.transform = `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px) scale(${progress})`;
        p.el.style.opacity = String(progress * 0.8);
        if (p.life <= 0) {
          p.el.remove();
          particles.splice(i, 1);
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      spawnParticles(e.clientX, e.clientY);
      ensureLoopRunning();
    };

    let particleAnimId: number = 0;
    let loopRunning = false;
    const animateParticles = () => {
      updateParticles();
      if (particles.length > 0) {
        particleAnimId = requestAnimationFrame(animateParticles);
      } else {
        loopRunning = false;
      }
    };
    const ensureLoopRunning = () => {
      if (!loopRunning) {
        loopRunning = true;
        particleAnimId = requestAnimationFrame(animateParticles);
      }
    };

    createParticleContainer();
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      if (particleAnimId) cancelAnimationFrame(particleAnimId);
      if (particleContainer) {
        particleContainer.remove();
        particleContainer = null;
      }
    };
  }, []);
}

// Keep old export name as alias for backward compatibility (will be cleaned up from pages)
export function useCustomCursor(
  _dotRef: React.RefObject<HTMLDivElement | null>,
) {
  // Legacy — now just activates the click splash without cursor dot
  useClickSplash();
}
