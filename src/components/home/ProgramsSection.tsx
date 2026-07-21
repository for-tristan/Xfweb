'use client';

/**
 * ProgramsSection — expandable accordion list.
 *
 * Restored: centered BlurText + v-highlight header.
 * Kept: filter chips, expandable accordion, color-coded levels.
 * Removed: dark section background (now standard white).
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionReveal, StaggerReveal } from '@/components/ScrollAnimations';
import { EnrollButton } from './EnrollButton';
import { BlurText } from './BlurText';
import GlareHover from '@/components/ui/GlareHover';
import StarBorder from '@/components/ui/StarBorder';
import type { Course } from '@/lib/types';

interface ProgramsSectionProps {
  courses: Course[];
  enrollmentStatus: Record<string, string>;
  onEnroll: (course: Course) => void;
  onNavigate: (courseId: string) => void;
}

type FilterLevel = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

const FILTERS: FilterLevel[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export function ProgramsSection({
  courses,
  enrollmentStatus,
  onEnroll,
  onNavigate,
}: ProgramsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterLevel>('All');

  const filtered = useMemo(() => {
    if (filter === 'All') return courses;
    return courses.filter((c) => (c.level || '').toLowerCase() === filter.toLowerCase());
  }, [courses, filter]);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="v-section v-programs-section" id="courses">
      <div className="v-programs-inner">
        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <h2 className="v-section-title">
              <BlurText text="Tech" tag="span" stagger={0.02} />{' '}
              <span className="v-highlight">Programs</span>
            </h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>
              Master technologies with our expert-led programs.
            </p>
          </div>
        </SectionReveal>

        {/* Filter chips */}
        <div className="v-programs-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`v-program-filter${filter === f ? ' v-program-filter--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Accordion list */}
        <StaggerReveal staggerDelay={60} direction="up">
          <div className="v-programs-list">
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((course) => {
                  const isOpen = expandedId === course.id;
                  return (
                    <motion.div
                      key={course.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`v-program-row${isOpen ? ' v-program-row--open' : ''}`}
                    >
                      <StarBorder
                        as="div"
                        className="v-program-row-starborder"
                        color="var(--accent)"
                        speed="5s"
                        thickness={1}
                      >
                      <GlareHover
                        width="100%"
                        height="auto"
                        background="var(--card-bg)"
                        borderRadius="14px"
                        borderColor="transparent"
                        glareColor="#ffffff"
                        glareOpacity={0.15}
                        glareAngle={-30}
                        glareSize={250}
                        transitionDuration={600}
                        className="v-program-row-glare"
                      >
                        <button
                          className="v-program-row-header"
                          onClick={() => toggle(course.id)}
                          aria-expanded={isOpen}
                        >
                          <div className="v-program-row-icon">
                            <i className={course.icon || 'fa-solid fa-graduation-cap'} />
                          </div>
                          <div className="v-program-row-text">
                            <span className="v-program-row-name">{course.name}</span>
                            <span className="v-program-row-meta">
                              {course.category} · {course.duration} · {course.price}
                            </span>
                          </div>
                          <span className={`v-program-row-chevron${isOpen ? ' v-program-row-chevron--open' : ''}`}>
                            <i className="fa-solid fa-chevron-down" />
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="v-program-row-body"
                            >
                              <div className="v-program-row-body-inner">
                                <p className="v-program-row-desc">{course.description}</p>

                                {course.features && course.features.length > 0 && (
                                  <div className="v-program-row-features">
                                    <span className="v-program-row-features-label">What you&apos;ll learn</span>
                                    <div className="v-program-row-features-tags">
                                      {course.features.slice(0, 8).map((f, i) => (
                                        <span key={i} className="v-program-row-feature-tag">{f}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="v-program-row-stats">
                                  {course.moduleCount != null && (
                                    <span><i className="fa-solid fa-layer-group" /> {course.moduleCount} modules</span>
                                  )}
                                  {course.enrollmentCount != null && (
                                    <span><i className="fa-solid fa-users" /> {course.enrollmentCount} enrolled</span>
                                  )}
                                </div>

                                <div className="v-program-row-actions">
                                  <button
                                    className="v-program-row-view"
                                    onClick={() => onNavigate(course.id)}
                                  >
                                    View Course <i className="fa-solid fa-arrow-right" style={{ fontSize: 11, marginLeft: 6 }} />
                                  </button>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <EnrollButton
                                      courseId={course.id}
                                      courseName={course.name}
                                      onEnroll={() => onEnroll(course)}
                                      status={enrollmentStatus[course.id]}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GlareHover>
                      </StarBorder>
                    </motion.div>
                  );
                })
              ) : (
                <div className="v-programs-empty">
                  <p>{filter === 'All' ? 'No programs available yet.' : `No ${filter.toLowerCase()} programs right now.`}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </StaggerReveal>
      </div>
    </section>
  );
}

export default ProgramsSection;
