import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * Combined course data endpoint — returns course + modules + enrollment +
 * tests + certificate in a SINGLE API call instead of 4 separate calls.
 * This eliminates 3 HTTP round-trips and 6 redundant DB queries.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getCurrentUser();

    // 1. Get course
    const course = await db.course.findUnique({
      where: { slug },
    });

    if (!course || course.status !== 'active') {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let modules: any[] = [];
    let enrollment: any = null;
    let tests: any[] = [];
    let certificate: any = null;

    if (user) {
      // Run enrollment + modules in parallel
      const [enroll, mods] = await Promise.all([
        db.enrollment.findFirst({
          where: { userId: user.id, courseId: slug, deletedAt: null },
        }),
        db.courseModule.findMany({
          where: { courseId: course.id },
          orderBy: { moduleOrder: 'asc' },
          include: {
            unlocks: {
              where: { userId: user.id },
              select: { id: true, userId: true, moduleId: true },
            },
          },
        }),
      ]);

      enrollment = enroll;
      modules = mods;

      // Get tests if enrolled
      if (enroll?.status === 'approved' && mods.length > 0) {
        const moduleIds = mods.map(m => m.id);
        const [moduleTests, testAttempts, testUnlocks, cert] = await Promise.all([
          db.moduleTest.findMany({
            where: { moduleId: { in: moduleIds } },
            include: { questions: { orderBy: { questionOrder: 'asc' } } },
          }),
          db.testAttempt.findMany({
            where: { testid: { in: moduleIds }, userid: user.id },
          }).catch(() => []),
          db.testUnlock.findMany({
            where: { testid: { in: moduleIds }, userid: user.id },
          }).catch(() => []),
          db.certificate.findUnique({
            where: { userId_courseId: { userId: user.id, courseId: slug } },
          }).catch(() => null),
        ]);

        const attemptMap = new Map(testAttempts.map((a: any) => [a.testid, a]));
        const unlockMap = new Map(testUnlocks.map((u: any) => [u.testid, u]));

        tests = moduleTests.map((t: any) => {
          const attempt = attemptMap.get(t.id);
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            timeLimit: t.timelimit,
            passingScore: t.passingscore,
            moduleId: t.moduleid,
            questionCount: t.questions?.length || 0,
            questions: t.questions || [],
            hasCompleted: !!attempt?.submittedat,
            attempt: attempt?.submittedat ? {
              score: attempt.score,
              totalPoints: attempt.totalpoints,
              passed: attempt.passed,
              submittedAt: attempt.submittedat,
            } : null,
            unlocked: unlockMap.has(t.id) || attempt !== undefined,
          };
        });

        certificate = cert;
      }
    }

    return NextResponse.json({
      course: {
        ...course,
        features: JSON.parse(course.features || '[]'),
      },
      modules: modules.map((m: any) => ({
        id: m.id,
        courseId: m.courseId,
        title: m.title,
        description: m.description,
        content: m.content,
        moduleOrder: m.moduleOrder,
        unlocked: m.unlocks?.length > 0,
        hasAccess: enrollment?.status === 'approved',
      })),
      enrollment: enrollment ? {
        id: enrollment.id,
        courseId: enrollment.courseId,
        courseName: enrollment.courseName,
        courseLevel: enrollment.courseLevel,
        duration: enrollment.duration,
        status: enrollment.status,
        experienceLevel: enrollment.experienceLevel,
        motivation: enrollment.motivation,
        enrolledAt: enrollment.enrolledAt,
        deletedAt: enrollment.deletedAt,
      } : null,
      tests,
      certificate: certificate ? {
        certificateId: certificate.certificateId,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate,
      } : null,
    });
  } catch (error) {
    console.error('Combined course data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
