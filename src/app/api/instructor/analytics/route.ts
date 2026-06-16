import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireInstructorOrAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    let courseSlugs: string[] = [];
    let courseCUIDs: string[] = [];

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
      courseSlugs = courses.map(c => c.slug);
      courseCUIDs = courses.map(c => c.id);
    }

    const totalStudents = isAdmin
      ? await db.enrollment.count({ where: { deletedAt: null, status: 'approved' } })
      : await db.enrollment.count({
          where: { deletedAt: null, status: 'approved', courseId: { in: courseSlugs } },
        });

    const pendingEnrollments = isAdmin
      ? await db.enrollment.count({ where: { deletedAt: null, status: 'pending' } })
      : await db.enrollment.count({
          where: { deletedAt: null, status: 'pending', courseId: { in: courseSlugs } },
        });

    const approvedEnrollments = isAdmin
      ? await db.enrollment.count({ where: { deletedAt: null, status: 'approved' } })
      : await db.enrollment.count({
          where: { deletedAt: null, status: 'approved', courseId: { in: courseSlugs } },
        });

    const coursePopularity = isAdmin
      ? await db.enrollment.groupBy({
          by: ['courseId', 'courseName'],
          where: { deletedAt: null },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        })
      : await db.enrollment.groupBy({
          by: ['courseId', 'courseName'],
          where: { deletedAt: null, courseId: { in: courseSlugs } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEnrollments = isAdmin
      ? await db.enrollment.findMany({
          where: { deletedAt: null, enrolledAt: { gte: sevenDaysAgo } },
          select: { enrolledAt: true, courseId: true, courseName: true, status: true },
          orderBy: { enrolledAt: 'asc' },
        })
      : await db.enrollment.findMany({
          where: { deletedAt: null, enrolledAt: { gte: sevenDaysAgo }, courseId: { in: courseSlugs } },
          select: { enrolledAt: true, courseId: true, courseName: true, status: true },
          orderBy: { enrolledAt: 'asc' },
        });

    const dailyTrends: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyTrends[key] = 0;
    }
    recentEnrollments.forEach((e) => {
      const key = e.enrolledAt.toISOString().split('T')[0];
      if (dailyTrends[key] !== undefined) dailyTrends[key]++;
    });

    const testModules = isAdmin
      ? await db.moduleTest.findMany({
          include: {
            _count: { select: { attempts: true } },
            attempts: { select: { passed: true } },
            module: { select: { title: true, courseId: true } },
          },
        })
      : await db.moduleTest.findMany({
          where: { module: { courseId: { in: courseCUIDs } } },
          include: {
            _count: { select: { attempts: true } },
            attempts: { select: { passed: true } },
            module: { select: { title: true, courseId: true } },
          },
        });

    const testPassRates = testModules.map((t) => {
      const totalAttempts = t.attempts.length;
      const passedAttempts = t.attempts.filter(a => a.passed).length;
      const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

      return {
        testId: t.id,
        testTitle: t.title,
        moduleTitle: t.module.title,
        totalAttempts,
        passedAttempts,
        passRate,
      };
    });

    const totalTestAttempts = testPassRates.reduce((sum, t) => sum + t.totalAttempts, 0);
    const totalPassed = testPassRates.reduce((sum, t) => sum + t.passedAttempts, 0);
    const overallPassRate = totalTestAttempts > 0 ? Math.round((totalPassed / totalTestAttempts) * 100) : 0;

    return NextResponse.json({
      totalStudents,
      pendingEnrollments,
      approvedEnrollments,
      coursePopularity,
      dailyTrends,
      testPassRates,
      overallPassRate,
      totalTestAttempts,
      totalPassed,
    });
  } catch (error) {
    console.error('Instructor analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
