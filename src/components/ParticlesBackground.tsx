'use client';

import { useEffect, useRef } from 'react';

/**
 * ParticlesBackground — Replaces the old CSS-animated floating particles.
 * Uses particles.js (vanilla) loaded via <Script> in layout.tsx.
 *
 * The container and canvas both have pointer-events: none so clicks
 * pass through to all content (footer, links, buttons, etc.).
 * Interactivity (hover bubble, click repulse) is disabled since
 * pointer-events must be none to avoid blocking page interaction.
 */

function getParticleColor(): string {
  if (typeof window === 'undefined') return '#ffffff';
  try {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--black').trim();
    const hex = bg.replace('#', '');
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 2);
      const b = parseInt(hex.substring(4, 6), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      // On light backgrounds use a subtle dark color; on dark use white
      return lum > 0.5 ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.6)';
    }
  } catch {}
  return '#ffffff';
}

export default function ParticlesBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tryInit = () => {
      if (initializedRef.current) return;
      if (!(window as any).particlesJS) {
        // Script not loaded yet — retry up to 20 times with 300ms intervals
        if (retryCountRef.current < 20) {
          retryCountRef.current++;
          setTimeout(tryInit, 300);
        }
        return;
      }
      if (!containerRef.current) return;

      initializedRef.current = true;
      const particleColor = getParticleColor();

      (window as any).particlesJS(containerRef.current.id, {
        particles: {
          number: { value: 160, density: { enable: true, value_area: 800 } },
          color: { value: particleColor },
          shape: {
            type: 'circle',
            stroke: { width: 0, color: '#000000' },
            polygon: { nb_sides: 5 },
            image: { src: 'img/github.svg', width: 100, height: 100 },
          },
          opacity: {
            value: 1,
            random: true,
            anim: { enable: true, speed: 1, opacity_min: 0, sync: false },
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: false, speed: 4, size_min: 0.3, sync: false },
          },
          line_linked: { enable: false, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 },
          move: {
            enable: true,
            speed: 1,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
            attract: { enable: false, rotateX: 600, rotateY: 600 },
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: false, mode: 'bubble' },
            onclick: { enable: false, mode: 'repulse' },
            resize: true,
          },
          modes: {
            grab: { distance: 400, line_linked: { opacity: 1 } },
            bubble: { distance: 250, size: 0, duration: 2, opacity: 0, speed: 3 },
            repulse: { distance: 400, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 },
          },
        },
        retina_detect: true,
      });
    };

    tryInit();

    return () => {
      if (initializedRef.current && (window as any).pJSDom && (window as any).pJSDom.length > 0) {
        try {
          // Find and destroy our instance
          const dom = (window as any).pJSDom;
          for (let i = dom.length - 1; i >= 0; i--) {
            if (dom[i]?.pJS?.canvas?.el?.parentElement?.id === 'xf-particles-js') {
              dom[i].pJS.fn.vendors.destroypJS();
              dom.splice(i, 1);
            }
          }
        } catch {
          // Ignore cleanup errors
        }
        initializedRef.current = false;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="xf-particles-js"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}
