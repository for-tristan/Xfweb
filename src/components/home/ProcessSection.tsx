'use client';

/**
 * ProcessSection — horizontal timeline.
 *
 * The track fills left-to-right with a CSS transition when the section
 * enters the viewport (not scroll-driven — that was laggy). Nodes
 * activate in sequence via staggered CSS transition delays.
 */

import { useEffect, useRef, useState } from 'react';
import { SectionReveal } from '@/components/ScrollAnimations';
import { BlurText } from './BlurText';

interface Phase {
  num: string;
  title: string;
  duration: string;
  desc: string;
}

const PHASES: Phase[] = [
  {
    num: '01',
    title: 'Discovery',
    duration: '1 week',
    desc: 'We listen before we pitch. You talk to a senior engineer, not a salesperson.',
  },
  {
    num: '02',
    title: 'Design',
    duration: '2 weeks',
    desc: 'Wireframes, then prototypes. You sign off on direction before code starts.',
  },
  {
    num: '03',
    title: 'Build',
    duration: '4-8 weeks',
    desc: 'Sprints with weekly demos. No surprises, no scope creep.',
  },
  {
    num: '04',
    title: 'Ship',
    duration: '1 week',
    desc: 'Deploy, monitor, iterate. We stay involved for 30 days post-launch.',
  },
];

export function ProcessSection() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
        } else {
          setActive(false);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="v-section v-process-section" id="process">
      <div className="v-section-inner">
        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <h2 className="v-section-title">
              <BlurText text="How We" tag="span" stagger={0.02} />{' '}
              <span className="v-highlight">Work</span>
            </h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>
              Four phases. Clear durations. No mystery.
            </p>
          </div>
        </SectionReveal>

        <div className="v-process-timeline" ref={timelineRef}>
          {/* Track line */}
          <div className="v-process-track">
            <div className={`v-process-track-fill${active ? ' v-process-track-fill--active' : ''}`} />
          </div>

          {/* Phase nodes */}
          <div className="v-process-nodes">
            {PHASES.map((phase, idx) => (
              <div key={phase.num} className="v-process-node-wrap">
                <div
                  className={`v-process-node${active ? ' v-process-node--active' : ''}`}
                  style={{ transitionDelay: `${idx * 200}ms` }}
                >
                  <span className="v-process-node-num">{phase.num}</span>
                </div>
                <div className="v-process-node-info">
                  <h3 className="v-process-node-title">{phase.title}</h3>
                  <span className="v-process-node-duration">{phase.duration}</span>
                  <p className="v-process-node-desc">{phase.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProcessSection;
