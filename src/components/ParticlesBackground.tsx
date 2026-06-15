'use client';

import { useEffect, useRef } from 'react';

/**
 * ParticlesBackground — Replaces the old CSS-animated floating particles.
 * Uses particles.js (vanilla) loaded from /js/particles.min.js.
 * Renders a full-viewport canvas behind all content.
 */

export default function ParticlesBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') return;

    const initParticles = () => {
      if (initializedRef.current) return;
      if (!(window as any).particlesJS) return;
      if (!containerRef.current) return;

      initializedRef.current = true;

      (window as any).particlesJS(containerRef.current.id, {
        particles: {
          number: {
            value: 80,
            density: { enable: true, value_area: 800 },
          },
          color: { value: '#ffffff' },
          shape: {
            type: 'circle',
            stroke: { width: 0, color: '#000000' },
            polygon: { nb_sides: 5 },
          },
          opacity: {
            value: 0.5,
            random: true,
            anim: { enable: true, speed: 1, opacity_min: 0, sync: false },
          },
          size: {
            value: 2,
            random: true,
            anim: { enable: false, speed: 4, size_min: 0.3, sync: false },
          },
          line_linked: {
            enable: false,
            distance: 150,
            color: '#ffffff',
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.8,
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
            onhover: { enable: true, mode: 'bubble' },
            onclick: { enable: true, mode: 'repulse' },
            resize: true,
          },
          modes: {
            grab: { distance: 400, line_linked: { opacity: 1 } },
            bubble: { distance: 250, size: 0, duration: 2, opacity: 0, speed: 3 },
            repulse: { distance: 200, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 },
          },
        },
        retina_detect: true,
      });
    };

    // Check if particles.js is already loaded
    if ((window as any).particlesJS) {
      initParticles();
    } else {
      // Load the script
      const script = document.createElement('script');
      script.src = '/js/particles.min.js';
      script.async = true;
      script.onload = initParticles;
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup: destroy particles instance
      if (initializedRef.current && (window as any).pJSDom && (window as any).pJSDom.length > 0) {
        try {
          // Remove the first particles instance (ours)
          const pjsInst = (window as any).pJSDom[0];
          if (pjsInst && pjsInst.pJS && pjsInst.pJS.canvas) {
            pjsInst.pJS.canvas.particles = [];
            pjsInst.pJS.fn.particlesEmpty();
          }
          (window as any).pJSDom = [];
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
        zIndex: 0,
        // pointer-events: auto so particles.js can detect hover/repulse,
        // but the canvas itself is behind all content (z-index 0) so
        // clicks on buttons/links/etc. reach their targets first.
      }}
    />
  );
}
