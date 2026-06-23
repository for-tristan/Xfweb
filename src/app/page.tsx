/**
 * Server component wrapper for the homepage.
 *
 * Fetches services, courses, team, and projects on the server (using
 * unstable_cache with 60s TTL) and passes them as initial data to
 * HomePageClient. This eliminates the client-side fetch waterfall —
 * the first paint now has real content.
 *
 * Admin mutations call revalidatePath('/') etc., which re-renders this
 * page; the unstable_cache entries refresh via their revalidate: 60 TTL.
 */

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import HomePageClient from './HomePageClient';

// ---- Cached data fetchers (server-side) -----------------------------------
// Same tags as the public API routes so admin mutations invalidate both.

const getServices = unstable_cache(
  async () => {
    return db.service.findMany({
      where: { status: 'active' },
      include: { features: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
  },
  ['landing-services-v1'],
  { tags: ['public-services'], revalidate: 60 }
);

const getCourses = unstable_cache(
  async () => {
    const courses = await db.course.findMany({
      where: { status: 'active' },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { modules: true } } },
    });

    const enrollmentCounts = await db.enrollment.groupBy({
      by: ['courseId'],
      where: {
        deletedAt: null,
        courseId: { in: courses.map((c) => c.slug) },
      },
      _count: { id: true },
    });
    const countMap = new Map(enrollmentCounts.map((e) => [e.courseId, e._count.id]));

    return courses.map((c) => ({
      ...c,
      features: JSON.parse(c.features || '[]'),
      moduleCount: c._count.modules,
      enrollmentCount: countMap.get(c.slug) || 0,
    }));
  },
  ['landing-courses-v1'],
  { tags: ['public-courses'], revalidate: 60 }
);

const getTeam = unstable_cache(
  async () => {
    return db.teamMember.findMany({ orderBy: { displayOrder: 'asc' } });
  },
  ['landing-team-v1'],
  { tags: ['public-team'], revalidate: 60 }
);

const getProjects = unstable_cache(
  async () => {
    const projects = await db.project.findMany({
      where: { status: 'active' },
      orderBy: { displayOrder: 'asc' },
    });
    return projects.map((p) => ({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
    }));
  },
  ['landing-projects-v1'],
  { tags: ['public-projects'], revalidate: 60 }
);

// ---- Types (must match HomePageClient's expected props) -------------------

interface DynamicService {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  status: string;
  features: { id: string; title: string; description: string; icon: string }[];
}

interface Course {
  id: string;
  name: string;
  category: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  icon: string;
  features: string[];
  enrollmentCount?: number;
}

// ---- Server component ------------------------------------------------------

export default async function Home() {
  // Fetch all four data sources in parallel on the server. Any failure
  // degrades gracefully — HomePageClient has its own client-side refresh
  // effect that will retry.
  const [services, courses, team, projects] = await Promise.all([
    getServices().catch(() => []),
    getCourses().catch(() => []),
    getTeam().catch(() => []),
    getProjects().catch(() => []),
  ]);

  // Transform courses to the shape HomePageClient expects (same mapping
  // that was previously done client-side in the useEffect).
  const mappedCourses: Course[] = courses.map((c: any) => ({
    id: c.slug,
    name: c.title,
    category: c.level + ' Course',
    description: c.description,
    level: c.level,
    duration: c.duration,
    price: c.price,
    icon: c.icon,
    features: Array.isArray(c.features) ? c.features : JSON.parse(c.features || '[]'),
    enrollmentCount: c.enrollmentCount || 0,
  }));

  return (
    <HomePageClient
      initialServices={services as DynamicService[]}
      initialCourses={mappedCourses}
      initialTeam={team as any[]}
      initialProjects={projects as any[]}
    />
  );
}
