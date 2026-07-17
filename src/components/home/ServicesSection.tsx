'use client';

/**
 * ServicesSection — Split layout: accordion (left) + About Us (right).
 *
 * Left side: expandable accordion panels (divider-only, no boxes).
 * Right side: About Us text + faded XFoundry SVG logo behind.
 *
 * Uses Font Awesome icons (theme-dynamic via CSS color variables).
 *
 * No panel auto-expands — user clicks to open.
 */

import { useState } from 'react';
import Link from 'next/link';
import { SectionReveal, StaggerReveal } from '@/components/ScrollAnimations';
import { Logo } from '@/components/Logo';
import type { Service } from '@/lib/types';
import { BlurText } from './BlurText';

interface ServicesSectionProps {
  services: Service[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const togglePanel = (idx: number) => {
    setExpandedIdx(prev => prev === idx ? null : idx);
  };

  return (
    <section className="v-section" id="services">
      <SectionReveal direction="up" delay={0}>
        <div className="v-section-header">
          <h2 className="v-section-title">
            <BlurText text="Your Digital Future," tag="span" stagger={0.02} />{' '}
            <span className="v-highlight">Built with Care</span>
          </h2>
          <p className="v-section-desc" style={{ marginTop: 16 }}>
            Comprehensive technology solutions designed to accelerate your digital transformation.
          </p>
        </div>
      </SectionReveal>

      <div className="v-services-split">
        {/* LEFT: Accordion (no containers, divider lines) */}
        <StaggerReveal staggerDelay={80} direction="up">
          <div className="v-services-accordion-d">
            {services.length > 0 ? (
              services.map((service, idx) => {
                const isOpen = expandedIdx === idx;
                return (
                  <div key={service.id} className={`v-service-panel-d${isOpen ? ' v-service-panel-d--open' : ''}`}>
                    <button
                      className="v-service-panel-d-header"
                      onClick={() => togglePanel(idx)}
                      aria-expanded={isOpen}
                    >
                      <div className="v-service-panel-d-icon-wrap">
                        <i className={service.icon || 'fa-solid fa-code'}></i>
                      </div>
                      <h3 className="v-service-panel-d-title">{service.title}</h3>
                      <span className="v-service-panel-d-toggle">
                        <i className={`fa-solid ${isOpen ? 'fa-minus' : 'fa-plus'}`}></i>
                      </span>
                    </button>

                    <div className="v-service-panel-d-content" style={{
                      maxHeight: isOpen ? '500px' : '0px',
                      opacity: isOpen ? 1 : 0,
                    }}>
                      <div className="v-service-panel-d-body">
                        {service.description && (
                          <p className="v-service-panel-d-desc">{service.description}</p>
                        )}
                        <Link href={`/services/${service.slug}`} className="v-service-panel-d-link">
                          Learn More <i className="fa-solid fa-arrow-right" style={{ fontSize: 11, marginLeft: 4 }}></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-dim)' }}>
                No services available yet.
              </div>
            )}
          </div>
        </StaggerReveal>

        {/* RIGHT: About Us text + faded glowing logo behind */}
        <SectionReveal direction="left" delay={200}>
          <div className="v-services-about">
            <div className="v-services-about-logo" aria-hidden="true">
              <Logo style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="v-services-about-content">
              <h3 className="v-services-about-title">
                We build technology that <span className="v-highlight">matters</span>.
              </h3>
              <p className="v-services-about-desc">
                XFoundry is a technology studio focused on building real-world solutions — from custom software and AI integrations to security auditing and team training. We don't just write code; we engineer products that scale, perform, and endure.
              </p>
              <p className="v-services-about-desc">
                Our team brings together expertise across the full stack, from infrastructure to interface. Whether you're a startup validating an idea or an enterprise modernizing legacy systems, we meet you where you are and build forward.
              </p>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

export default ServicesSection;
