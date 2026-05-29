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

    // Get enrollment counts for all active courses in one query
    // courseId in Enrollment stores the course slug
    const enrollmentCounts = await db.enrollment.groupBy({
      by: ['courseId'],
      where: {
        deletedAt: null,
        courseId: { in: courses.map(c => c.slug) },
      },
      _count: { id: true },
    });

    // Create a lookup map: slug -> enrollment count
    const countMap = new Map(
      enrollmentCounts.map(e => [e.courseId, e._count.id])
    );

    // Parse JSON string fields to proper types
    const parsed = courses.map(c => ({
      ...c,
      features: JSON.parse(c.features || '[]'),
      moduleCount: c._count.modules,
      enrollmentCount: countMap.get(c.slug) || 0,
    }));

    return NextResponse.json({ courses: parsed });
  } catch (error) {
    console.error('Public courses fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
