'use client';

/**
 * Dashboard utility functions + shared sub-components.
 *
 * Extracted from dashboard/page.tsx to keep the main page focused on
 * data fetching and layout rather than presentation primitives.
 */

import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sub?: string;
  compact?: boolean;
}

export function StatCard({ label, value, icon, color, sub, compact }: StatCardProps) {
  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
        backdropFilter: 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
        borderRadius: 12,
        padding: compact ? '14px 14px' : '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: compact ? 10 : 14,
        }}
      >
        <div
          style={{
            width: compact ? 28 : 36,
            height: compact ? 28 : 36,
            borderRadius: 8,
            background: `color-mix(in srgb, ${color} 7%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className={`fas ${icon}`} style={{ fontSize: compact ? 10 : 13, color }} />
        </div>
        <span
          style={{
            fontSize: compact ? 8 : 10,
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontFamily: 'var(--font-body)',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: compact ? 18 : 26,
          fontWeight: 700,
          color: 'var(--text-light)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: compact ? 9 : 11, color: 'var(--text-dim)', marginTop: 4, opacity: 0.7 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  pct: number;
  height?: number;
}

export function ProgressBar({ pct, height = 6 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped === 100
      ? 'var(--success-color)'
      : clamped >= 50
        ? 'var(--accent)'
        : 'var(--warning-color)';
  return (
    <div style={{ width: '100%', height, background: 'var(--input-bg)', borderRadius: height, overflow: 'hidden' }}>
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: height,
          background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 80%, transparent))`,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
}

interface SectionHeaderProps {
  icon: string;
  title: string;
  color?: string;
}

export function SectionHeader({ icon, title, color = 'var(--accent)' }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 4, height: 18, borderRadius: 8, background: color }} />
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-light)',
          letterSpacing: 0.5,
          margin: 0,
        }}
      >
        {title}
      </h3>
    </div>
  );
}

interface WeekChartProps {
  sessions: { date: string; duration: number }[];
}

export function WeekChart({ sessions }: WeekChartProps) {
  const days = getLast7Days();
  const dayData = days.map((d) => {
    const s = sessions.find((s) => s.date === d);
    return { date: d, seconds: s ? s.duration : 0 };
  });

  const maxSecs = Math.max(...dayData.map((d) => d.seconds), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, paddingTop: 10 }}>
      {dayData.map((d, i) => {
        const h = maxSecs > 0 ? Math.max(4, (d.seconds / maxSecs) * 80) : 4;
        const isToday = i === 6;
        return (
          <div
            key={d.date}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <div
              style={{
                fontSize: 9,
                color: 'var(--text-dim)',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
              }}
            >
              {d.seconds > 0 ? formatDuration(d.seconds) : ''}
            </div>
            <div
              style={{
                width: '100%',
                height: h,
                borderRadius: 8,
                background: isToday
                  ? 'linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 40%, transparent))'
                  : d.seconds > 0
                    ? 'color-mix(in srgb, var(--accent) 20%, transparent)'
                    : 'var(--input-bg)',
                border: isToday
                  ? '1px solid color-mix(in srgb, var(--accent) 25%, transparent)'
                  : '1px solid transparent',
                transition: 'height 0.5s ease',
                minWidth: 8,
              }}
            />
            <div
              style={{
                fontSize: 9,
                fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--accent)' : 'var(--text-dim)',
                fontFamily: 'var(--font-body)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {WEEKDAYS[new Date(d.date + 'T00:00:00').getDay()]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
