'use client';

import { useRef, useEffect, useCallback, type ReactNode } from 'react';

interface FluidGlassProps {
  children: ReactNode;
  className?: string;
  /** Whether the glass is in "scrolled" compact state */
  compact?: boolean;
}

export function FluidGlassNav({ children, className = '', compact = false }: FluidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const specularRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!specularRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    specularRef.current.style.background = `
      radial-gradient(
        ellipse 80% 60% at ${x}% ${y}%,
        rgba(255,255,255,0.22) 0%,
        rgba(255,255,255,0.06) 40%,
        transparent 70%
      )
    `;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => el.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  return (
    <div
      ref={containerRef}
      className={`fluid-glass ${className}`}
      data-compact={compact || undefined}
    >
      <div className="fg-frost" />
      <div className="fg-fill" />
      <div
        ref={specularRef}
        className="fg-specular"
      />
      <div className="fg-shine" />
      <div className="fg-border" />
      <div className="fg-rim" />
      <div className="fg-content">
        {children}
      </div>
    </div>
  );
}

// Re-export default for compatibility
export default FluidGlassNav;
