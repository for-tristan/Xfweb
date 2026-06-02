import { useEffect } from 'react';

/**
 * Custom cursor hook — Glowing Orb Dot + Particle Burst + Magnetic Snap.
 * (Canvas trail is handled separately by useCanvasCursor)
 *
 * • Dot: solid accent orb that follows cursor instantly with glow aura
 * • Particle Burst: on every click, tiny particles explode from the cursor
 * • Magnetic Snap: cursor gravitates toward interactive elements on hover
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

export function useCustomCursor(
  dotRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    // Hide on devices without hover capability (touch / mobile)
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isTouchDevice = !hasHover || isCoarse;
    if (isTouchDevice) {
      const dot = dotRef.current;
      if (dot) dot.style.display = 'none';
      return;
    }

    let mx = 0, my = 0;

    // ── Particle Burst State ──
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

    // ── Mouse Move ──
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const dot = dotRef.current;
      if (dot) {
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
      }
    };

    // ── Click → Particle Burst ──
    const onClick = (e: MouseEvent) => {
      spawnParticles(e.clientX, e.clientY);
      ensureLoopRunning();
      const dot = dotRef.current;
      if (dot) {
        dot.classList.add('clicked');
        setTimeout(() => dot.classList.remove('clicked'), 300);
      }
    };

    // ── Particle animation loop (only runs when particles exist) ──
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

    // ── Hover Detection ──
    const interactiveSelector =
      'a, button, input, select, textarea, [role="button"], ' +
      '.service-card, .project-card, .filter-btn, .course-card, ' +
      '.team-card, .social-link, .nav-auth-btn, .nav-user-btn, ' +
      '.nav-logout-btn, .v-course-card, .v-card, tr';

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const closest = t.closest(interactiveSelector);
      const dot = dotRef.current;
      if (closest && dot) dot.classList.add('hovered');
    };

    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const closest = t.closest(interactiveSelector);
      const dot = dotRef.current;
      if (closest && dot) dot.classList.remove('hovered');
    };

    // ── Init ──
    createParticleContainer();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    // Don't start particle loop here — it starts on-demand when particles are spawned
    document.body.classList.add('cursor-active');

    return () => {
      document.body.classList.remove('cursor-active');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      if (particleAnimId) cancelAnimationFrame(particleAnimId);
      if (particleContainer) {
        particleContainer.remove();
        particleContainer = null;
      }
    };
  }, [dotRef]);
}
