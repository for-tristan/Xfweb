'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin once
gsap.registerPlugin(ScrollTrigger);

/**
 * useScroll3D — GSAP ScrollTrigger-powered 3D scroll animation system
 *
 * Applies perspective depth, 3D rotation, parallax scaling, and opacity
 * fades to sections as they scroll in/out of the viewport. Also applies
 * subtle 3D tilt to card elements based on scroll position.
 *
 * Respects `prefers-reduced-motion` — disables all animations when active.
 */
export function useScroll3D(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    // Respect reduced motion preference
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const sections = container.querySelectorAll('.v-section');
      sections.forEach((section) => {
        // Animate IN: fade + scale + subtle rotation as section enters viewport
        gsap.fromTo(
          section,
          { opacity: 0.15, scale: 0.94, rotateX: 2 },
          {
            opacity: 1,
            scale: 1,
            rotateX: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 90%',
              end: 'top 30%',
              scrub: 1,
            },
          }
        );

        // Animate OUT: subtle fade + scale down as section leaves viewport
        gsap.to(section, {
          opacity: 0.15,
          scale: 0.96,
          rotateX: -1,
          ease: 'power2.in',
          scrollTrigger: {
            trigger: section,
            start: 'bottom 70%',
            end: 'bottom 20%',
            scrub: 1,
          },
        });
      });

      const hero = container.querySelector('.v-hero');
      if (hero) {
        gsap.fromTo(
          hero,
          { opacity: 1, scale: 1, y: 0 },
          {
            opacity: 0,
            scale: 0.85,
            y: -60,
            ease: 'power2.in',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 1,
            },
          }
        );
      }

      // Reuse the sections already queried above — one ScrollTrigger per section
      // for all its cards (much cheaper than one trigger per card)
      sections.forEach((section) => {
        const cards = section.querySelectorAll(
          '.v-service-card, .v-project-card, .v-course-card, .v-team-card'
        );
        if (cards.length === 0) return;
        // One trigger per section for all its cards
        gsap.fromTo(
          cards,
          { rotateY: -3, rotateX: 2, opacity: 0.6 },
          {
            rotateY: 0,
            rotateX: 0,
            opacity: 1,
            ease: 'power2.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              end: 'top 40%',
              scrub: 0.8,
            },
          }
        );
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef]);
}
