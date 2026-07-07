'use client';

/**
 * ServicesSection — "Your Digital Future, Built with Care" section.
 * Renders service cards from the database (admin-managed).
 * Clicking a card navigates to /services/[slug].
 *
 * Uses a real <Link> (not a div with onClick) so that:
 * 1. The ClientProviders click interceptor detects the navigation
 *    immediately and shows the 3-dot loader (no blank-screen gap).
 * 2. SEO crawlers can follow the link.
 * 3. Keyboard nav + screen readers work properly.
 * 4. Right-click "open in new tab" + middle-click work.
 */

import Link from 'next/link';
import { SectionReveal, StaggerReveal } from '@/components/ScrollAnimations';
import type { Service } from '@/lib/types';
import { BlurText } from './BlurText';

interface ServicesSectionProps {
  services: Service[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
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

      <StaggerReveal staggerDelay={100} direction="up">
        <div className="v-services-grid">
          {services.length > 0 ? (
            services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="v-service-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="v-service-icon">
                  <i className={service.icon}></i>
                </div>
                <h3>{service.title}</h3>
                <span className="v-service-link">
                  Learn More <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i>
                </span>
              </Link>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#5d5d5d' }}>
              No services available yet.
            </div>
          )}
        </div>
      </StaggerReveal>
    </section>
  );
}

export default ServicesSection;
