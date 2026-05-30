import { useEffect } from 'react';

/**
 * Reusable custom cursor hook.
 * Encapsulates dot/ring tracking, ring lerp animation, hover detection,
 * and cursor-active body class management.
 *
 * Reads from refs dynamically (dotRef.current / ringRef.current) so that
 * the cursor keeps working even when the DOM elements are remounted
 * (e.g. transitioning from a loading skeleton to the main content).
 *
 * @param dotRef  - ref to the cursor dot element
 * @param ringRef - ref to the cursor ring element
 */
export function useCustomCursor(
  dotRef: React.RefObject<HTMLDivElement | null>,
  ringRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    // Hide on devices without hover capability (touch / mobile)
    if (!window.matchMedia('(hover: hover)').matches) {
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (dot) dot.style.display = 'none';
      if (ring) ring.style.display = 'none';
      return;
    }

    let mx = 0, my = 0, rx = 0, ry = 0;
    let animId: number;

    // Read refs dynamically so remounted elements are picked up automatically
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const dot = dotRef.current;
      if (dot) {
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
      }
    };

    const animate = () => {
      const ring = ringRef.current;
      if (ring) {
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
      }
      animId = requestAnimationFrame(animate);
    };

    // Hover detection: grow ring when hovering interactive elements
    const interactiveSelector =
      'a, button, input, select, textarea, [role="button"], ' +
      '.service-card, .project-card, .filter-btn, .course-card, ' +
      '.team-card, .social-link, .nav-auth-btn, .nav-user-btn, ' +
      '.nav-logout-btn, tr';

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const ring = ringRef.current;
      if (t.closest(interactiveSelector) && ring) ring.classList.add('hovered');
    };

    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const ring = ringRef.current;
      if (t.closest(interactiveSelector) && ring) ring.classList.remove('hovered');
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    animate();
    document.body.classList.add('cursor-active');

    return () => {
      document.body.classList.remove('cursor-active');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [dotRef, ringRef]);
}
