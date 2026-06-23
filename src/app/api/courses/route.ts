import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

// Server-side cache with 60s TTL. revalidatePath('/api/courses') in admin
// mutations busts the route cache; the unstable_cache entry refreshes via
// its revalidate: 60 option. CDN layer (s-maxage) handles edge caching.
const getCourses = unstable_cache(
  async () => {
    const courses = await db.course.findMany({
      where: { status: 'active' },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { modules: true },
        },
      },
    });

    const enrollmentCounts = await db.enrollment.groupBy({
      by: ['courseId'],
      where: {
        deletedAt: null,
        courseId: { in: courses.map(c => c.slug) },
      },
      _count: { id: true },
    });

    const countMap = new Map(
      enrollmentCounts.map(e => [e.courseId, e._count.id])
    );

    return courses.map(c => ({
      ...c,
      features: JSON.parse(c.features || '[]'),
      moduleCount: c._count.modules,
      enrollmentCount: countMap.get(c.slug) || 0,
    }));
  },
  ['public-courses-v1'],
  {
    tags: ['public-courses'],
    revalidate: 60,
  }
);

export async function GET(request: NextRequest) {
  try {
    const parsed = await getCourses();

    return NextResponse.json(
      { courses: parsed },
      {
        headers: {
          // CDN caches for 60s, then serves stale while revalidating for 300s.
          // Browser still gets fresh data (must-revalidate). Admin mutations
          // call revalidatePath('/api/courses') for route-level invalidation.
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Public courses fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
