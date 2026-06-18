import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireInstructorOrAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    // For instructors, we first need to fetch their accessible course
    // slugs/CUIDs (one round-trip) because those values are inputs to
    // the subsequent filters. For admins, no preliminary fetch is
    // needed — the queries below can all fire in parallel.
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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── Parallelize the 6 independent queries ──
    // Each branch (admin vs instructor) only differs in the WHERE clause,
    // but the queries themselves never depend on each other's results.
    // Previously this ran as 6 sequential awaits, so latency was the SUM
    // of 6 libSQL round-trips. Now it's the MAX.
    const enrollmentWhere = isAdmin
      ? { deletedAt: null }
      : { deletedAt: null, courseId: { in: courseSlugs } };

    const [
      totalStudents,
      pendingEnrollments,
      approvedEnrollments,
      coursePopularity,
      recentEnrollments,
      testModules,
    ] = await Promise.all([
      db.enrollment.count({ where: { ...enrollmentWhere, status: 'approved' } }),
      db.enrollment.count({ where: { ...enrollmentWhere, status: 'pending' } }),
      db.enrollment.count({ where: { ...enrollmentWhere, status: 'approved' } }),
      db.enrollment.groupBy({
        by: ['courseId', 'courseName'],
        where: enrollmentWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      db.enrollment.findMany({
        where: { ...enrollmentWhere, enrolledAt: { gte: sevenDaysAgo } },
        select: { enrolledAt: true, courseId: true, courseName: true, status: true },
        orderBy: { enrolledAt: 'asc' },
      }),
      isAdmin
        ? db.moduleTest.findMany({
            include: {
              _count: { select: { attempts: true } },
              attempts: { select: { passed: true } },
              module: { select: { title: true, courseId: true } },
            },
          })
        : db.moduleTest.findMany({
            where: { module: { courseId: { in: courseCUIDs } } },
            include: {
              _count: { select: { attempts: true } },
              attempts: { select: { passed: true } },
              module: { select: { title: true, courseId: true } },
            },
          }),
    ]);

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
