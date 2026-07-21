'use client';

/**
 * TechStackSection — LogoLoop marquee of tech icons.
 *
 * Uses the React Bits LogoLoop component with react-icons for actual
 * tech brand icons (React, Next.js, TypeScript, etc.). Pauses on hover,
 * fades at edges.
 */

import { SectionReveal } from '@/components/ScrollAnimations';
import { BlurText } from './BlurText';
import { LogoLoop, type LogoItem } from '@/components/ui/LogoLoop';
import {
  SiReact, SiNextdotjs, SiTypescript, SiTailwindcss,
  SiNodedotjs, SiPython, SiPostgresql, SiPrisma,
  SiDocker, SiCloudflare, SiRedis,
  SiGraphql, SiStripe, SiVercel,
} from 'react-icons/si';

const TECH_LOGOS: LogoItem[] = [
  { node: <SiReact />, title: 'React', href: 'https://react.dev' },
  { node: <SiNextdotjs />, title: 'Next.js', href: 'https://nextjs.org' },
  { node: <SiTypescript />, title: 'TypeScript', href: 'https://www.typescriptlang.org' },
  { node: <SiTailwindcss />, title: 'Tailwind CSS', href: 'https://tailwindcss.com' },
  { node: <SiNodedotjs />, title: 'Node.js', href: 'https://nodejs.org' },
  { node: <SiPython />, title: 'Python', href: 'https://python.org' },
  { node: <SiPostgresql />, title: 'PostgreSQL', href: 'https://postgresql.org' },
  { node: <SiPrisma />, title: 'Prisma', href: 'https://prisma.io' },
  { node: <SiDocker />, title: 'Docker', href: 'https://docker.com' },
  { node: <SiCloudflare />, title: 'Cloudflare', href: 'https://cloudflare.com' },
  { node: <SiRedis />, title: 'Redis', href: 'https://redis.io' },
  { node: <SiGraphql />, title: 'GraphQL', href: 'https://graphql.org' },
  { node: <SiStripe />, title: 'Stripe', href: 'https://stripe.com' },
  { node: <SiVercel />, title: 'Vercel', href: 'https://vercel.com' },
];

export function TechStackSection() {
  return (
    <section className="v-section v-techstack-section" id="tech">
      <div className="v-section-inner">
        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <h2 className="v-section-title">
              <BlurText text="Our" tag="span" stagger={0.02} />{' '}
              <span className="v-highlight">Stack</span>
            </h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>
              Technologies we use every day.
            </p>
          </div>
        </SectionReveal>
      </div>

      {/* LogoLoop marquee — full-bleed to screen edge */}
      <div style={{ height: '80px', position: 'relative', overflow: 'hidden' }}>
        <LogoLoop
          logos={TECH_LOGOS}
          speed={80}
          direction="left"
          logoHeight={36}
          gap={48}
          hoverSpeed={0}
          scaleOnHover
          fadeOut
          fadeOutColor="var(--black)"
          ariaLabel="Technology stack"
        />
      </div>
    </section>
  );
}

export default TechStackSection;
