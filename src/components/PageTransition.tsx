'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';


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

  useEffect(() => {
    const pathChanged = pathname !== prevPathRef.current;
    if (!pathChanged) return;
    prevPathRef.current = pathname;

    const currentPhase = phaseRef.current;

    if (currentPhase === 'loading') {
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
          }, 500);
        }, 150);
      }
    } else if (currentPhase === 'idle') {
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
      }, 400);
    } else if (currentPhase === 'fading') {
      setDisplayChildren(children);
    }

    return () => clearAllTimeouts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (phaseRef.current === 'idle') setDisplayChildren(children);
  }, [children]);

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
      {phase !== 'idle' && (
        <div className={`xf-page-loader ${phase === 'fading' ? 'xf-page-loader-fading' : ''}`}>
          <div className="xf-loader-dot" />
          <div className="xf-loader-dot" />
          <div className="xf-loader-dot" />
        </div>
      )}

      {displayChildren}
    </>
  );
}
