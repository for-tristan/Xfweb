import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireInstructorOrAdmin } from '@/lib/auth';

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
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const includeStudy = searchParams.get('includeStudy') === 'true';
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    // Get instructor's course slugs and CUIDs for scoping
    let instructorSlugs: string[] = [];
    let instructorCUIDs: string[] = [];

    if (isInstructor && user) {
      const courses = await db.course.findMany({
        where: { instructorId: user.id },
        select: { id: true, slug: true },
      });
      instructorSlugs = courses.map(c => c.slug);
      instructorCUIDs = courses.map(c => c.id);
    }

    // If includeStudy with userId+courseId, return module-level study data
    if (includeStudy && userId && courseId) {
      // Verify this course belongs to the instructor
      if (isInstructor && !instructorSlugs.includes(courseId)) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this course' }, { status: 403 });
      }

      // Resolve slug to CUID for module lookup
      const course = await db.course.findUnique({ where: { slug: courseId } });
      const whereCourseId = course ? course.id : courseId;

      const modules = await db.courseModule.findMany({
        where: { courseId: whereCourseId },
        orderBy: { moduleOrder: 'asc' },
      });

      const studies = await db.moduleStudy.findMany({
        where: { userId, moduleId: { in: modules.map(m => m.id) } },
      });

      const studyMap = new Map(studies.map(s => [s.moduleId, s]));

      // Get test attempts for these modules
      const moduleIds = modules.map(m => m.id);
      const tests = await db.moduleTest.findMany({
        where: { moduleId: { in: moduleIds } },
        include: {
          attempts: {
            where: { userId },
            select: { score: true, totalPoints: true, passed: true, submittedAt: true },
          },
        },
      });

      const moduleStudies = modules.map(m => {
        const study = studyMap.get(m.id);
        const moduleTests = tests.filter(t => t.moduleId === m.id);
        const testScores = moduleTests.map(t => {
          const attempt = t.attempts[0]; // Most recent/only attempt
          return {
            testId: t.id,
            testTitle: t.title,
            score: attempt?.score || 0,
            totalPoints: attempt?.totalPoints || 0,
            passed: attempt?.passed || false,
            submittedAt: attempt?.submittedAt?.toISOString() || null,
          };
        });

        return {
          moduleId: m.id,
          moduleTitle: m.title,
          moduleOrder: m.moduleOrder,
          timeSpent: study?.timeSpent || 0,
          studied: study?.studied || false,
          lastStudied: study?.lastStudied?.toISOString() || '',
          testScores,
        };
      });

      return NextResponse.json({ moduleStudies });
    }


    // Build where clause for course progress
    const progressWhere: Record<string, unknown> = {};

    if (courseId) {
      // Filter by specific course
      if (isInstructor && !instructorSlugs.includes(courseId)) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this course' }, { status: 403 });
      }
      progressWhere.courseId = courseId;
    } else if (isInstructor) {
      // Only show progress for instructor's courses
      progressWhere.courseId = { in: instructorSlugs };
    }

    const progressRecords = await db.courseProgress.findMany({
      where: progressWhere,
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
    const enrollmentWhere: Record<string, unknown> = { deletedAt: null, status: 'approved' };
    if (isInstructor) {
      enrollmentWhere.courseId = { in: instructorSlugs };
    }

    const activeEnrollments = await db.enrollment.findMany({
      where: enrollmentWhere,
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
    const allCourses = isAdmin
      ? await db.course.findMany({ select: { id: true, slug: true } })
      : await db.course.findMany({
          where: { id: { in: instructorCUIDs } },
          select: { id: true, slug: true },
        });
    const courseMap = new Map(allCourses.map(c => [c.slug, c.id]));

    // Batch-fetch module counts using groupBy instead of N+1
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

    // Fetch test attempts for students in these courses
    // Get unique user+course combinations for test lookup
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
    console.error('Instructor progress fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
