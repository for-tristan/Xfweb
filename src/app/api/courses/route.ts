import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
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

    const parsed = courses.map(c => ({
      ...c,
      features: JSON.parse(c.features || '[]'),
      moduleCount: c._count.modules,
      enrollmentCount: countMap.get(c.slug) || 0,
    }));

    return NextResponse.json(
      { courses: parsed },
      {
        headers: {
          // Public homepage content — only changes when an admin edits it.
          // CDN/browser can serve a fresh copy for 60s, and a stale copy
          // for up to 5 min while revalidating in the background.
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
