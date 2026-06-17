'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);


export function useScroll3D(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const sections = container.querySelectorAll('.v-section');
      sections.forEach((section) => {
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

      sections.forEach((section) => {
        const cards = section.querySelectorAll(
          '.v-service-card, .v-project-card, .v-course-card, .v-team-card'
        );
        if (cards.length === 0) return;
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
