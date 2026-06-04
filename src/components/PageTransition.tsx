'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// ═══════════════════════════════════════════════════
// PAGE TRANSITION — Vaulta dot pulse loader
// Shows the accent dot pulse overlay on route changes.
//
// Flow:
// 1. NavigationInterceptor fires 'xf:navigation-start'
//    → dot loader fades in (covering the page)
// 2. Next.js route changes → pathname updates
//    → swap content behind loader, then fade loader out
// 3. Animation completes → idle state
// ═══════════════════════════════════════════════════

type Phase = 'idle' | 'loading' | 'fading';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const [displayChildren, setDisplayChildren] = useState(children);
  const phaseRef = useRef<Phase>('idle');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const swappedRef = useRef(false);
  const prevPathRef = useRef(pathname);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const updatePhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // Listen for navigation start event
  useEffect(() => {
    const onNavStart = () => {
      if (phaseRef.current === 'idle') {
        updatePhase('loading');
        swappedRef.current = false;
      }
    };
    window.addEventListener('xf:navigation-start', onNavStart);
    return () => window.removeEventListener('xf:navigation-start', onNavStart);
  }, [updatePhase]);

  // Detect pathname change
  useEffect(() => {
    const pathChanged = pathname !== prevPathRef.current;
    if (!pathChanged) return;
    prevPathRef.current = pathname;

    const currentPhase = phaseRef.current;

    if (currentPhase === 'loading') {
      // Loader already visible — swap content and fade out
      if (!swappedRef.current) {
        swappedRef.current = true;
        clearAllTimeouts();
        addTimeout(() => {
          setDisplayChildren(children);
          window.scrollTo(0, 0);
          updatePhase('fading');
          addTimeout(() => {
            updatePhase('idle');
            swappedRef.current = false;
          }, 500); // fade-out duration
        }, 150); // small buffer so loader is visible
      }
    } else if (currentPhase === 'idle') {
      // Browser nav (back/forward) or missed event
      updatePhase('loading');
      swappedRef.current = false;
      addTimeout(() => {
        setDisplayChildren(children);
        window.scrollTo(0, 0);
        updatePhase('fading');
        addTimeout(() => {
          updatePhase('idle');
          swappedRef.current = false;
        }, 500);
      }, 400); // show loader briefly
    } else if (currentPhase === 'fading') {
      setDisplayChildren(children);
    }

    return () => clearAllTimeouts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Keep children in sync when idle
  useEffect(() => {
    if (phaseRef.current === 'idle') setDisplayChildren(children);
  }, [children]);

  // Safety: force idle if stuck
  useEffect(() => {
    if (phase === 'idle') return;
    const t = setTimeout(() => {
      if (phaseRef.current !== 'idle') {
        updatePhase('idle');
        swappedRef.current = false;
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [phase, updatePhase]);

  return (
    <>
      {/* Vaulta dot pulse loader overlay */}
      {phase !== 'idle' && (
        <div className={`xf-page-loader ${phase === 'fading' ? 'xf-page-loader-fading' : ''}`}>
          <div className="xf-loader-dot" />
          <div className="xf-loader-dot" />
          <div className="xf-loader-dot" />
        </div>
      )}

      {/* Page content */}
      {displayChildren}
    </>
  );
}
