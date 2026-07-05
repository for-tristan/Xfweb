'use client';

/**
 * FaqSection — "Got Questions?" section with collapsible FAQ items.
 * The FAQ data is static (no admin management yet).
 */

import { SectionReveal, StaggerReveal } from '@/components/ScrollAnimations';
import { BlurText } from './BlurText';
import { FaqItem } from './FaqItem';

const FAQ_ITEMS = [
  {
    q: 'how do these programs work?',
    a: `We dont teach you We Guide, instruct and test you throughout the program, we show you how to do it yourself and work efficiently , dependently and be more productive at what you wanna Learn. `,
  },
  {
    q: 'Are the programs really free?',
    a: 'Yes! For now since we are in our pre-production phase, all courses are completely free of charge.',
  },
  {
    q: 'What technologies do We work with?',
    a: 'We specialize in various technologies including python, java, Frontend Development, and Backend Development, Software Engineering, and more.',
  },
  {
    q: 'How do I request a custom project?',
    a: 'Navigate to our Contact section or use the "Request Quote" button on any service page. Fill in your project details, and our team will get back to you within 24 hours.',
  },
];

export function FaqSection() {
  return (
    <section className="v-section" id="faq">
      <SectionReveal direction="up" delay={0}>
        <div className="v-section-header">
          <h2 className="v-section-title">
            <BlurText text="Got" tag="span" stagger={0.02} />{' '}
            <span className="v-highlight">Questions?</span>
          </h2>
          <p className="v-section-desc" style={{ marginTop: 16 }}>
            Everything you need to know about X-Foundry courses and services.
          </p>
        </div>
      </SectionReveal>
      <StaggerReveal staggerDelay={100} direction="up">
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {FAQ_ITEMS.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} index={i} />
          ))}
        </div>
      </StaggerReveal>
    </section>
  );
}

export default FaqSection;
