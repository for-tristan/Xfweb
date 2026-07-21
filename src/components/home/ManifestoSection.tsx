'use client';

/**
 * ManifestoSection — positioning statement under the hero.
 *
 * Uses Inter Tight (the site's standard font) + the v-highlight animated
 * gradient for key words. No "00 — Position" eyebrow. Left-aligned.
 */

import { SectionReveal } from '@/components/ScrollAnimations';

export function ManifestoSection() {
  return (
    <section className="v-manifesto" aria-label="Position">
      <div className="v-manifesto-inner">
        <SectionReveal direction="up" delay={0}>
          <h2 className="v-manifesto-headline">
            We&apos;re new. <span className="v-highlight">That&apos;s the point.</span>
          </h2>
        </SectionReveal>

        <SectionReveal direction="up" delay={120}>
          <p className="v-manifesto-body">
            No bloated agency. No junior account managers. No six-month contracts scoped to protect margins. You work with the people building your thing, directly.
          </p>
        </SectionReveal>

        <SectionReveal direction="up" delay={200}>
          <div className="v-manifesto-divider" />
        </SectionReveal>

        <div className="v-manifesto-list">
          <SectionReveal direction="up" delay={280}>
            <div className="v-manifesto-list-item">
              <span className="v-manifesto-list-not">Not an agency.</span>
              <span className="v-manifesto-list-is">A Dev Studio.</span>
            </div>
          </SectionReveal>
          <SectionReveal direction="up" delay={340}>
            <div className="v-manifesto-list-item">
              <span className="v-manifesto-list-not">Not a bootcamp.</span>
              <span className="v-manifesto-list-is">Engineers who Build.</span>
            </div>
          </SectionReveal>
          <SectionReveal direction="up" delay={400}>
            <div className="v-manifesto-list-item">
              <span className="v-manifesto-list-not">Not a 50-person team.</span>
              <span className="v-manifesto-list-is">Small and Senior.</span>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

export default ManifestoSection;
