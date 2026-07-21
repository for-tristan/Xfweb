'use client';

/**
 * SectionHeader — editorial section opener.
 *
 * Replaces the old BlurText + v-highlight + 1-line desc template that
 * every section used identically. This one has:
 *
 * 1. NUMBERED EYEBROW — "01 — Services" in Instrument Serif italic.
 *    Signals intentional ordering, not auto-incremented templating.
 *
 * 2. OPINIONATED HEADLINE — left-aligned, Inter Tight, specific copy
 *    that a competitor couldn't copy-paste. No "Comprehensive solutions."
 *
 * 3. OPTIONAL SUBLINE — dim, max-width 55ch, left-aligned. Adds context
 *    without being a generic tagline.
 *
 * Left-aligned, not centered. This breaks the centered-template pattern
 * that made every section look the same.
 */

import { SectionReveal } from '@/components/ScrollAnimations';

interface SectionHeaderProps {
  number: string;
  label: string;
  title: React.ReactNode;
  subline?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({
  number,
  label,
  title,
  subline,
  align = 'left',
}: SectionHeaderProps) {
  const isCenter = align === 'center';

  return (
    <SectionReveal direction="up" delay={0}>
      <div className={`v-section-header-editorial${isCenter ? ' v-section-header-editorial--center' : ''}`}>
        <p className="v-section-eyebrow">
          <span className="v-section-eyebrow-num">{number}</span>
          <span className="v-section-eyebrow-dash">—</span>
          <span className="v-section-eyebrow-label">{label}</span>
        </p>
        <h2 className="v-section-title-editorial">{title}</h2>
        {subline && <p className="v-section-subline">{subline}</p>}
      </div>
    </SectionReveal>
  );
}

export default SectionHeader;
