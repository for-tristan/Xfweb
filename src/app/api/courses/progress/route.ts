import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const progressRecords = await db.courseProgress.findMany({
      where: { userId: user.id },
      orderBy: { lastAccessed: 'desc' },
    });

    // Fetch all courses to build slug→CUID mapping
    const allCourses = await db.course.findMany({ select: { id: true, slug: true } });
    const courseMap = new Map(allCourses.map(c => [c.slug, c.id]));

    // FIX: Get unique course CUIDs and batch-fetch module counts using groupBy
    const uniqueCourseIds = [...new Set(progressRecords.map(r => {
      const cuid = courseMap.get(r.courseId);
      return cuid || r.courseId;
    }))];

    const moduleCountResults = await db.courseModule.groupBy({
      by: ['courseId'],
      where: { courseId: { in: uniqueCourseIds } },
      _count: { id: true },
    });
    const moduleCounts: Record<string, number> = {};
    for (const result of moduleCountResults) {
      moduleCounts[result.courseId] = result._count.id;
    }

    const progress = progressRecords.map((record) => {
      let completedModules: number[];
      try {
        completedModules = JSON.parse(record.completedModules || '[]');
      } catch {
        completedModules = [];
      }

      const resolvedCourseId = courseMap.get(record.courseId) || record.courseId;
      const totalModules = moduleCounts[resolvedCourseId] || 0;
      const completionPercentage = totalModules > 0
        ? Math.round((completedModules.length / totalModules) * 100)
        : 0;

      return {
        id: record.id,
        courseId: record.courseId,
        courseName: record.courseName,
        completedModules,
        totalModules,
        completionPercentage,
        lastAccessed: record.lastAccessed,
      };
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: 'Progress tracking is managed by administrators' }, { status: 403 });
}
