import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, deleteAllUserSessions } from '@/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null };
  }
  if (user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

// Dynamically fetch total module count for a course from the database
async function getTotalModules(courseId: string): Promise<number> {
  try {
    // courseId in CourseProgress stores the slug, CourseModule stores the CUID
    // First try to find the course by slug to get its CUID
    const course = await db.course.findUnique({ where: { slug: courseId } });
    const whereCourseId = course ? course.id : courseId;
    const count = await db.courseModule.count({ where: { courseId: whereCourseId } });
    return count > 0 ? count : 1; // fallback to 1 to avoid division by zero
  } catch {
    return 1;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const includeStudy = searchParams.get('includeStudy') === 'true';
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    // If includeStudy with userId+courseId, return module-level study data
    if (includeStudy && userId && courseId) {
      // Resolve slug to CUID for module lookup
      const course = await db.course.findUnique({ where: { slug: courseId } });
      const whereCourseId = course ? course.id : courseId;

      const modules = await db.courseModule.findMany({
        where: { courseId: whereCourseId },
        orderBy: { moduleOrder: 'asc' },
      });

      // FIX: ModuleStudy doesn't have moduleOrder, join through module relation
      const studies = await db.moduleStudy.findMany({
        where: { userId, moduleId: { in: modules.map(m => m.id) } },
      });

      const studyMap = new Map(studies.map(s => [s.moduleId, s]));

      const moduleStudies = modules.map(m => {
        const study = studyMap.get(m.id);
        return {
          moduleId: m.id,
          moduleTitle: m.title,
          moduleOrder: m.moduleOrder, // Get from CourseModule, not ModuleStudy
          timeSpent: study?.timeSpent || 0,
          studied: study?.studied || false,
          lastStudied: study?.lastStudied?.toISOString() || '',
        };
      });

      return NextResponse.json({ moduleStudies });
    }

    const progressRecords = await db.courseProgress.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: { lastAccessed: 'desc' },
    });

    // Fetch active (non-cancelled) enrollments to filter out orphaned progress
    const activeEnrollments = await db.enrollment.findMany({
      where: { deletedAt: null, status: 'approved' },
      select: { userId: true, courseId: true },
    });
    const activeEnrollmentSet = new Set(
      activeEnrollments.map(e => `${e.userId}:${e.courseId}`)
    );

    // Only keep progress records for users with an active approved enrollment
    const filteredRecords = progressRecords.filter(r =>
      activeEnrollmentSet.has(`${r.userId}:${r.courseId}`)
    );

    // Fetch all courses once to build a slug→CUID mapping
    const allCourses = await db.course.findMany({ select: { id: true, slug: true } });
    const courseMap = new Map(allCourses.map(c => [c.slug, c.id]));

    // FIX: Batch-fetch module counts using groupBy instead of N+1
    const resolvedIds = [...new Set(filteredRecords.map(r => {
      const cuid = courseMap.get(r.courseId);
      return cuid || r.courseId;
    }))];

    const moduleCountResults = await db.courseModule.groupBy({
      by: ['courseId'],
      where: { courseId: { in: resolvedIds } },
      _count: { id: true },
    });
    const moduleCounts: Record<string, number> = {};
    for (const result of moduleCountResults) {
      moduleCounts[result.courseId] = result._count.id;
    }

    const progress = filteredRecords.map((record) => {
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
        userId: record.userId,
        courseId: record.courseId,
        courseName: record.courseName,
        completedModules,
        totalModules,
        completionPercentage,
        lastAccessed: record.lastAccessed,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        user: record.user,
      };
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Admin progress fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, courseId, courseName, completedModules } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(completedModules)) {
      return NextResponse.json(
        { error: 'completedModules must be an array of module numbers' },
        { status: 400 }
      );
    }

    // Upsert CourseProgress
    const progress = await db.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        courseName: courseName || courseId,
        completedModules: JSON.stringify(completedModules),
        lastAccessed: new Date(),
      },
      update: {
        completedModules: JSON.stringify(completedModules),
        lastAccessed: new Date(),
      },
    });

    const totalModules = await getTotalModules(courseId);
    const completionPercentage = totalModules > 0
      ? Math.round((completedModules.length / totalModules) * 100)
      : 0;

    return NextResponse.json({
      message: 'Progress updated successfully',
      progress: {
        ...progress,
        completedModules,
        totalModules,
        completionPercentage,
      },
    });
  } catch (error) {
    console.error('Admin progress update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'userId and courseId are required' }, { status: 400 });
    }

    // Reset progress to empty
    const progress = await db.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        courseName: courseId,
        completedModules: '[]',
        lastAccessed: new Date(),
      },
      update: {
        completedModules: '[]',
        lastAccessed: new Date(),
      },
    });

    return NextResponse.json({ message: 'Progress reset successfully', progress });
  } catch (error) {
    console.error('Admin progress reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
