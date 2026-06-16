import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireInstructorOrAdmin } from '@/lib/auth';

async function getTotalModules(courseId: string): Promise<number> {
  try {
    const course = await db.course.findUnique({ where: { slug: courseId } });
    const whereCourseId = course ? course.id : courseId;
    const count = await db.courseModule.count({ where: { courseId: whereCourseId } });
    return count > 0 ? count : 1;
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

    let instructorSlugs: string[] = [];
    let instructorCUIDs: string[] = [];

    if (isInstructor && user) {
      const courses = await db.course.findMany({
        where: {
          OR: [
            { instructorId: user.id },
            { isGlobal: true },
          ],
        },
        select: { id: true, slug: true },
      });
      instructorSlugs = courses.map(c => c.slug);
      instructorCUIDs = courses.map(c => c.id);
    }

    if (includeStudy && userId && courseId) {
      if (isInstructor && !instructorSlugs.includes(courseId)) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this course' }, { status: 403 });
      }

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
          const attempt = t.attempts[0];
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


    const progressWhere: Record<string, unknown> = {};

    if (courseId) {
      if (isInstructor && !instructorSlugs.includes(courseId)) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this course' }, { status: 403 });
      }
      progressWhere.courseId = courseId;
    } else if (isInstructor) {
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

    const filteredRecords = progressRecords.filter(r =>
      activeEnrollmentSet.has(`${r.userId}:${r.courseId}`)
    );

    const allCourses = isAdmin
      ? await db.course.findMany({ select: { id: true, slug: true } })
      : await db.course.findMany({
          where: { id: { in: instructorCUIDs } },
          select: { id: true, slug: true },
        });
    const courseMap = new Map(allCourses.map(c => [c.slug, c.id]));

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
    console.error('Instructor progress fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
