'use client';

/**
 * ProjectsSection — "Featured Projects" section with draggable carousel.
 * Projects are duplicated to create a seamless infinite scroll effect.
 */

import { SectionReveal } from '@/components/ScrollAnimations';
import { SmartImage } from '@/components/SmartImage';
import DraggableScroll from '@/components/DraggableScroll';
import type { Project } from '@/lib/types';
import { BlurText } from './BlurText';

interface ProjectsSectionProps {
  projects: Project[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const renderProjectCard = (project: Project, keyPrefix = '') => (
    <div key={`${keyPrefix}${project.id}`} className="v-project-showcase-card" data-category={project.category}>
      {project.imageUrl && (
        <div className="v-project-showcase-img">
          <SmartImage
            src={project.imageUrl}
            alt={project.title}
            width={600}
            height={400}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
      <div className="v-project-showcase-info">
        <div className="v-project-tags">
          {Array.isArray(project.tags) ? (
            project.tags.map((tag: string, i: number) => (
              <span key={i} className="v-project-tag">{tag}</span>
            ))
          ) : (
            <span className="v-project-tag">{project.category}</span>
          )}
        </div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        {project.projectUrl ? (
          <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="v-project-link">
            View Project →
          </a>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className="v-section" id="projects">
      <SectionReveal direction="up" delay={0}>
        <div className="v-section-header">
          <h2 className="v-section-title">
            <BlurText text="Featured" tag="span" stagger={0.02} />{' '}
            <span className="v-highlight">Projects</span>
          </h2>
          <p className="v-section-desc" style={{ marginTop: 16 }}>
            Explore our portfolio of real-world projects.
          </p>
        </div>
      </SectionReveal>

      <DraggableScroll className="v-projects-showcase" autoSpeed={0.8}>
        {projects.length > 0 && (
          <>
            {projects.map((project) => renderProjectCard(project))}
            {projects.map((project) => renderProjectCard(project, 'dup-'))}
          </>
        )}
      </DraggableScroll>

      <div className="v-projects-drag-hint">
        <i className="fa-solid fa-arrows-left-right" />
        <span>Drag to explore</span>
      </div>
    </section>
  );
}

export default ProjectsSection;
