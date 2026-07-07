import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireInstructorOrAdmin } from '@/lib/auth';


async function verifyTestAccess(
  testId: string,
  instructorId: string | undefined,
  isInstructor: boolean,
  isAdmin: boolean,
): Promise<{ test: any; error: NextResponse | null }> {
  const test = await db.moduleTest.findUnique({
    where: { id: testId },
    include: { module: { select: { id: true, title: true, courseId: true } } },
  });

  if (!test) {
    return { test: null, error: NextResponse.json({ error: 'Test not found' }, { status: 404 }) };
  }

  // SECURITY: Instructors can only manage tests in courses they own.
  // Previously this check allowed instructors to manage tests in ANY
  // global course — same privilege-escalation bug as the courses PUT
  // route. Global courses are admin-only.
  if (isInstructor && instructorId) {
    const course = await db.course.findUnique({ where: { id: test.module.courseId } });
    if (!course || course.instructorId !== instructorId) {
      return { test: null, error: NextResponse.json({ error: 'Forbidden: You can only manage tests in your own courses' }, { status: 403 }) };
    }
  }

  return { test, error: null };
}


async function verifyModuleCourseAccess(
  moduleId: string,
  instructorId: string | undefined,
  isInstructor: boolean,
  isAdmin: boolean,
): Promise<{ module: any; error: NextResponse | null }> {
  const module_ = await db.courseModule.findUnique({ where: { id: moduleId } });
  if (!module_) {
    return { module: null, error: NextResponse.json({ error: 'Module not found' }, { status: 404 }) };
  }

  // SECURITY: same fix as verifyTestAccess — drop isGlobal exception.
  if (isInstructor && instructorId) {
    const course = await db.course.findUnique({ where: { id: module_.courseId } });
    if (!course || course.instructorId !== instructorId) {
      return { module: null, error: NextResponse.json({ error: 'Forbidden: You can only manage modules in your own courses' }, { status: 403 }) };
    }
  }

  return { module: module_, error: null };
}

/**
 * SECURITY: Verify that a target userId is actively enrolled (approved)
 * in the course that owns the given testId. Prevents instructors from
 * unlocking tests / resetting attempts for arbitrary users who aren't
 * in their course.
 */
async function verifyTargetUserEnrolled(testId: string, userId: string): Promise<{ error: NextResponse | null }> {
  const test = await db.moduleTest.findUnique({
    where: { id: testId },
    select: { module: { select: { courseId: true } } },
  });
  if (!test) {
    return { error: NextResponse.json({ error: 'Test not found' }, { status: 404 }) };
  }
  const course = await db.course.findUnique({
    where: { id: test.module.courseId },
    select: { slug: true },
  });
  if (!course) {
    return { error: NextResponse.json({ error: 'Course not found' }, { status: 404 }) };
  }
  const enrollment = await db.enrollment.findFirst({
    where: {
      userId,
      courseId: course.slug,
      status: 'approved',
      deletedAt: null,
    },
  });
  if (!enrollment) {
    return { error: NextResponse.json({ error: 'Target user is not enrolled in this course' }, { status: 403 }) };
  }
  return { error: null };
}

export async function GET(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const viewGrades = searchParams.get('viewGrades');

    if (testId) {
      const { test, error: accessError } = await verifyTestAccess(testId, user?.id, isInstructor, isAdmin);
      if (accessError) return accessError;

      const fullTest = await db.moduleTest.findUnique({
        where: { id: testId },
        include: {
          questions: { orderBy: { questionOrder: 'asc' } },
          attempts: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
          unlocks: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          module: {
            select: { id: true, title: true, courseId: true },
          },
        },
      });

      const course = await db.course.findUnique({
        where: { id: fullTest!.module.courseId },
        select: { slug: true },
      });

      let enrolledStudents: { user: { id: string; name: string; email: string; avatar: string | null } }[] = [];
      if (course) {
        const enrolled = await db.enrollment.findMany({
          where: { courseId: course.slug, status: 'approved', deletedAt: null },
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        });
        const seen = new Set<string>();
        for (const e of enrolled) {
          if (!seen.has(e.userId)) {
            seen.add(e.userId);
            enrolledStudents.push({ user: e.user });
          }
        }
      }

      return NextResponse.json({ test: fullTest, enrolledStudents });
    }

    const instructorCourseIds = isInstructor && user
      ? (await db.course.findMany({
          where: {
            OR: [
              { instructorId: user.id },
              { isGlobal: true },
            ],
          },
          select: { id: true },
        })).map(c => c.id)
      : [];

    const moduleFilter = isInstructor
      ? { courseId: { in: instructorCourseIds } }
      : {};

    if (viewGrades === '1') {
      const tests = await db.moduleTest.findMany({
        orderBy: { createdAt: 'desc' },
        where: isInstructor
          ? { module: { courseId: { in: instructorCourseIds } } }
          : undefined,
        include: {
          module: {
            select: { id: true, title: true, courseId: true },
          },
          attempts: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      return NextResponse.json({ tests });
    }

    const tests = await db.moduleTest.findMany({
      orderBy: { createdAt: 'desc' },
      where: isInstructor
        ? { module: { courseId: { in: instructorCourseIds } } }
        : undefined,
      include: {
        _count: { select: { questions: true, attempts: true } },
        module: {
          select: { title: true, courseId: true },
        },
      },
    });

    const testsList = tests.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      timeLimit: t.timeLimit,
      passingScore: t.passingScore,
      questionCount: t._count.questions,
      attemptCount: t._count.attempts,
      moduleId: t.moduleId,
      moduleTitle: t.module.title,
      courseId: t.module.courseId,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({ tests: testsList });
  } catch (error) {
    console.error('Instructor tests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const { moduleId, title, description, timeLimit, passingScore } = body;

    if (!moduleId || !title) {
      return NextResponse.json({ error: 'moduleId and title are required' }, { status: 400 });
    }

    const { module: mod, error: accessError } = await verifyModuleCourseAccess(moduleId, user?.id, isInstructor, isAdmin);
    if (accessError) return accessError;

    const test = await db.moduleTest.create({
      data: {
        moduleId,
        title,
        description: description || '',
        timeLimit: timeLimit !== undefined ? timeLimit : 30,
        passingScore: passingScore !== undefined ? passingScore : 70,
      },
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error('Instructor tests create error:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const { action } = body;

    if (action === 'addQuestion') {
      const { testId, questionText, options, correctAnswer, points } = body;

      if (!testId || !questionText || !Array.isArray(options)) {
        return NextResponse.json({ error: 'testId, questionText, and options are required' }, { status: 400 });
      }

      const { error: accessError } = await verifyTestAccess(testId, user?.id, isInstructor, isAdmin);
      if (accessError) return accessError;

      const questionCount = await db.testQuestion.count({ where: { testId } });

      const question = await db.testQuestion.create({
        data: {
          testId,
          questionText,
          questionType: 'multiple_choice',
          options: JSON.stringify(options),
          correctAnswer: correctAnswer !== undefined ? correctAnswer : 0,
          points: points !== undefined ? points : 1,
          questionOrder: questionCount,
        },
      });

      return NextResponse.json({ question });
    }

    if (action === 'deleteQuestion') {
      const { testId, questionId } = body;

      if (!testId || !questionId) {
        return NextResponse.json({ error: 'testId and questionId are required' }, { status: 400 });
      }

      const { error: accessError } = await verifyTestAccess(testId, user?.id, isInstructor, isAdmin);
      if (accessError) return accessError;

      await db.testQuestion.delete({ where: { id: questionId } });

      return NextResponse.json({ message: 'Question deleted' });
    }

    if (action === 'unlock') {
      const { testId, userId } = body;

      if (!testId || !userId) {
        return NextResponse.json({ error: 'testId and userId are required' }, { status: 400 });
      }

      const { error: accessError } = await verifyTestAccess(testId, user?.id, isInstructor, isAdmin);
      if (accessError) return accessError;

      // SECURITY: Verify the target user is actually enrolled in the
      // course that owns this test. Prevents instructors from unlocking
      // tests for arbitrary users (inflating pass rates, gifting certs).
      const { error: enrollError } = await verifyTargetUserEnrolled(testId, userId);
      if (enrollError) return enrollError;

      try {
        await db.testAttempt.deleteMany({
          where: { testId, userId, submittedAt: { not: null } },
        }).catch(() => {});

        await db.testUnlock.upsert({
          where: { testId_userId: { testId, userId } },
          create: { testId, userId, unlockedBy: user!.id },
          update: {},
        });

        const testInfo = await db.moduleTest.findUnique({ where: { id: testId } });
        if (testInfo) {
          await db.notification.create({
            data: {
              userId,
              title: 'Test Unlocked',
              message: `"${testInfo.title}" has been unlocked. You can now take the test.`,
              type: 'success',
            },
          }).catch(() => {});
        }
      } catch (createErr) {
        console.error('Test unlock error:', createErr);
        return NextResponse.json({ error: 'Failed to unlock test' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Test unlocked for user' });
    }

    if (action === 'lock') {
      const { testId, userId } = body;

      if (!testId || !userId) {
        return NextResponse.json({ error: 'testId and userId are required' }, { status: 400 });
      }

      const { error: accessError } = await verifyTestAccess(testId, user?.id, isInstructor, isAdmin);
      if (accessError) return accessError;

      // SECURITY: same enrollment check as unlock — prevents instructors
      // from locking tests for arbitrary users (DoS / harassment vector).
      const { error: enrollError } = await verifyTargetUserEnrolled(testId, userId);
      if (enrollError) return enrollError;

      try {
        const existing = await db.testUnlock.findUnique({
          where: { testId_userId: { testId, userId } },
        });

        if (!existing) {
          return NextResponse.json({ message: 'Test was not unlocked for this user' });
        }

        await db.testUnlock.delete({ where: { id: existing.id } });

        await db.testAttempt.deleteMany({
          where: { testId, userId, submittedAt: null },
        }).catch(() => {});

        const testInfo = await db.moduleTest.findUnique({ where: { id: testId } });
        if (testInfo) {
          await db.notification.create({
            data: {
              userId,
              title: 'Test Locked',
              message: `"${testInfo.title}" has been locked.`,
              type: 'warning',
            },
          }).catch(() => {});
        }
      } catch (deleteErr) {
        console.error('Test lock error:', deleteErr);
        return NextResponse.json({ error: 'Failed to lock test' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Test locked for user' });
    }

    if (action === 'resetAttempt') {
      const { testId, userId } = body;

      if (!testId || !userId) {
        return NextResponse.json({ error: 'testId and userId are required' }, { status: 400 });
      }

      const { error: accessError } = await verifyTestAccess(testId, user?.id, isInstructor, isAdmin);
      if (accessError) return accessError;

      // SECURITY: same enrollment check — prevents instructors from
      // wiping any user's test attempt history.
      const { error: enrollError } = await verifyTargetUserEnrolled(testId, userId);
      if (enrollError) return enrollError;

      await db.testAttempt.deleteMany({ where: { testId, userId } });

      return NextResponse.json({ message: 'Attempt reset for user' });
    }

    if (action === 'resetAllAttempts') {
      const { testId } = body;

      if (!testId) {
        return NextResponse.json({ error: 'testId is required' }, { status: 400 });
      }

      const { error: accessError } = await verifyTestAccess(testId, user?.id, isInstructor, isAdmin);
      if (accessError) return accessError;

      const result = await db.testAttempt.deleteMany({ where: { testId } });

      return NextResponse.json({ message: `All attempts reset (${result.count} deleted)` });
    }

    const { id, title, description, timeLimit, passingScore } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error: accessError } = await verifyTestAccess(id, user?.id, isInstructor, isAdmin);
    if (accessError) return accessError;

    const test = await db.moduleTest.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(passingScore !== undefined && { passingScore }),
      },
    });

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Instructor tests PUT error:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error: accessError } = await verifyTestAccess(id, user?.id, isInstructor, isAdmin);
    if (accessError) return accessError;

    await db.testAttempt.deleteMany({ where: { testId: id } });
    await db.testUnlock.deleteMany({ where: { testId: id } });
    await db.testQuestion.deleteMany({ where: { testId: id } });
    await db.moduleTest.delete({ where: { id } });

    return NextResponse.json({ message: 'Test deleted' });
  } catch (error) {
    console.error('Instructor test delete error:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}
