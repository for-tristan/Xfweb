'use client';

/**
 * TeamSection — team grid with hover reveal.
 *
 * Each card shows avatar + name + role by default.
 * On hover, a bio overlay fades in covering the card.
 */

import { SectionReveal, StaggerReveal } from '@/components/ScrollAnimations';
import { SmartImage } from '@/components/SmartImage';
import { SITE } from '@/lib/constants';
import { BlurText } from './BlurText';
import type { TeamMember } from '@/lib/types';

interface TeamSectionProps {
  team: TeamMember[];
}

export function TeamSection({ team }: TeamSectionProps) {
  return (
    <section className="v-section v-team-section" id="team">
      <div className="v-section-inner">
        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <h2 className="v-section-title">
              <BlurText text="Meet The" tag="span" stagger={0.02} />{' '}
              <span className="v-highlight">Team</span>
            </h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>
              The people behind {SITE.name}
            </p>
          </div>
        </SectionReveal>

        <StaggerReveal direction="up" staggerDelay={100}>
          <div className="v-team-grid">
            {team.length > 0 ? (
              team.map((m) => (
                <div key={m.id} className="v-team-card v-team-card--hover">
                  {/* Default content */}
                  <div className="v-team-card-default">
                    <div className="v-team-avatar" style={m.avatar ? { padding: 0 } : {}}>
                      {m.avatar ? (
                        <SmartImage
                          src={m.avatar}
                          alt={m.name}
                          width={200}
                          height={200}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <i className={m.icon || 'fa-solid fa-user-tie'}></i>
                      )}
                    </div>
                    <h3>{m.name}</h3>
                    <span className="v-team-role">{m.role}</span>
                  </div>

                  {/* Hover overlay — always rendered, fades in on hover */}
                  <div className="v-team-bio-overlay">
                    <div className="v-team-bio-content">
                      <h3>{m.name}</h3>
                      <span className="v-team-role">{m.role}</span>
                      {m.bio && <p>{m.bio}</p>}
                      {(m.linkedinUrl || m.githubUrl) && (
                        <div className="v-team-socials">
                          {m.linkedinUrl && (
                            <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer">
                              <i className="fa-brands fa-linkedin-in"></i>
                            </a>
                          )}
                          {m.githubUrl && (
                            <a href={m.githubUrl} target="_blank" rel="noopener noreferrer">
                              <i className="fa-brands fa-github"></i>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <i className="fa-solid fa-users" style={{ fontSize: 32, marginBottom: 16, opacity: 0.3, display: 'block' }}></i>
                <p style={{ fontSize: 15, fontWeight: 600 }}>No team members yet.</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Check back soon to meet the team.</p>
              </div>
            )}
          </div>
        </StaggerReveal>
      </div>
    </section>
  );
}

export default TeamSection;
