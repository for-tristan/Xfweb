'use client';

import React from 'react';

// ═══════════════════════════════════════════════════
// SKELETON SCREEN COMPONENTS
// Pulsing animation skeleton placeholders for loading states
// ═══════════════════════════════════════════════════

const skeletonBase: React.CSSProperties = {
  background: 'var(--border-color, rgba(255,255,255,0.08))',
  borderRadius: 4,
};

interface SkeletonTextProps {
  width?: string | number;
  height?: number;
  lines?: number;
  gap?: number;
  style?: React.CSSProperties;
}

export function SkeletonText({ width = '100%', height = 16, lines = 1, gap = 8, style }: SkeletonTextProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, width }}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="xf-skeleton-pulse"
          style={{
            ...skeletonBase,
            height,
            width: lines > 1 && i === lines - 1 ? '70%' : width,
            ...style,
          }}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  width?: string | number;
  height?: number | string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function SkeletonCard({ width = '100%', height = 280, style, children }: SkeletonCardProps) {
  return (
    <div
      className="xf-skeleton-pulse"
      style={{
        ...skeletonBase,
        width,
        height: typeof height === 'number' ? height : height,
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: number;
  style?: React.CSSProperties;
}

export function SkeletonAvatar({ size = 48, style }: SkeletonAvatarProps) {
  return (
    <div
      className="xf-skeleton-pulse"
      style={{
        ...skeletonBase,
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

interface SkeletonButtonProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export function SkeletonButton({ width = 120, height = 40, style }: SkeletonButtonProps) {
  return (
    <div
      className="xf-skeleton-pulse"
      style={{
        ...skeletonBase,
        width,
        height,
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════
// PRE-BUILT SKELETON LAYOUTS
// ═══════════════════════════════════════════════════

/** Hero section skeleton (title + subtitle + buttons) */
export function SkeletonHero() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '60px 20px' }}>
      <SkeletonButton width={220} height={32} />
      <SkeletonText width={400} height={48} style={{ borderRadius: 8, maxWidth: '90%' }} />
      <SkeletonText width={300} height={20} style={{ maxWidth: '80%' }} />
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <SkeletonButton width={140} height={48} />
        <SkeletonButton width={160} height={48} />
      </div>
    </div>
  );
}

/** Service card skeleton with icon + title + description */
export function SkeletonServiceCard() {
  return (
    <div style={{
      background: 'var(--card-bg, #111)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      borderRadius: 12,
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <SkeletonAvatar size={48} />
      <SkeletonText width={180} height={20} />
      <SkeletonText width="100%" height={14} lines={3} gap={6} />
      <SkeletonText width={100} height={14} />
    </div>
  );
}

/** Course card skeleton with image area + title + meta */
export function SkeletonCourseCard() {
  return (
    <div style={{
      background: 'var(--card-bg, #111)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div
        className="xf-skeleton-pulse"
        style={{
          ...skeletonBase,
          height: 180,
          borderRadius: 0,
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        }}
      />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonText width={120} height={12} />
        <SkeletonText width="80%" height={18} />
        <SkeletonText width="100%" height={14} lines={2} gap={6} />
        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          <SkeletonText width={70} height={12} />
          <SkeletonText width={80} height={12} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <SkeletonButton width={60} height={24} />
          <SkeletonButton width={70} height={24} />
          <SkeletonButton width={55} height={24} />
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <SkeletonButton width={110} height={36} />
        </div>
      </div>
    </div>
  );
}

/** Auth gate loading skeleton - shows XFoundry branding */
export function SkeletonAuthGate() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9990,
      background: 'rgba(7,7,7,0.95)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 24,
    }}>
      {/* Logo Animation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 900,
          fontSize: 28,
          color: 'var(--text-light, #fff)',
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
          XFoundry
        </span>
      </div>

      {/* Animated loading bar */}
      <div style={{ width: 200, height: 2, background: 'var(--border-color, rgba(255,255,255,0.08))', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: '40%',
          height: '100%',
          background: 'var(--primary-red)',
          borderRadius: 2,
          animation: 'skeleton-bar-slide 1.5s ease-in-out infinite',
        }} />
      </div>

      <span style={{
        color: 'var(--text-dim, #888)',
        fontSize: 14,
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        Loading experience...
      </span>
    </div>
  );
}

/** Section header skeleton */
export function SkeletonSectionHeader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 48 }}>
      <SkeletonButton width={100} height={24} />
      <SkeletonText width={260} height={36} style={{ borderRadius: 6 }} />
      <div style={{ width: 60, height: 2, background: 'var(--border-color, rgba(255,255,255,0.08))', borderRadius: 2 }} />
      <SkeletonText width={400} height={16} style={{ maxWidth: '90%' }} />
    </div>
  );
}
