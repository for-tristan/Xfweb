'use client';

import { useRef, useEffect, useCallback, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════
   FluidGlass — CSS glass component inspired by ReactBits
   MeshTransmissionMaterial visual style.

   Visible layers (bottom → top):
   1. Backdrop frost   — backdrop-filter blur + saturate + brightness
   2. Glass fill        — translucent tinted background
   3. Specular highlight— radial-gradient that follows mouse
   4. Top-edge shine    — bright white gradient at top edge
   5. Chromatic border  — directional borders simulating refraction
   6. Accent glow       — colored box-shadows
   7. Content           — children (z-10)
   ═══════════════════════════════════════════════════════════ */

interface FluidGlassProps {
  children: ReactNode;
  className?: string;
  /** Whether the glass is in "scrolled" compact state */
  compact?: boolean;
}

export function FluidGlassNav({ children, className = '', compact = false }: FluidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const specularRef = useRef<HTMLDivElement>(null);

  // ── Mouse-responsive specular highlight ──
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
      {/* ── Layer 1: Backdrop frost ── */}
      <div className="fg-frost" />

      {/* ── Layer 2: Glass fill (translucent tinted background) ── */}
      <div className="fg-fill" />

      {/* ── Layer 3: Specular highlight (mouse-follow) ── */}
      <div
        ref={specularRef}
        className="fg-specular"
      />

      {/* ── Layer 4: Top-edge shine ── */}
      <div className="fg-shine" />

      {/* ── Layer 5: Chromatic border + accent glow ── */}
      <div className="fg-border" />

      {/* ── Layer 6: Rim light (mask-painted edge gradient) ── */}
      <div className="fg-rim" />

      {/* ── Content ── */}
      <div className="fg-content">
        {children}
      </div>
    </div>
  );
}

// Re-export default for compatibility
export default FluidGlassNav;
