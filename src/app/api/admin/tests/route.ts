import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const viewGrades = searchParams.get('viewGrades');

    // Return single test with questions, attempts, unlocks, and enrolled students
    if (testId) {
      const test = await db.moduleTest.findUnique({
        where: { id: testId },
        include: {
          questions: { orderBy: { questionOrder: 'asc' } },
          attempts: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          unlocks: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          module: {
            select: { id: true, title: true, courseId: true },
          },
        },
      });

      if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

      // Fetch approved enrollments for this course directly on the server
      const course = await db.course.findUnique({
        where: { id: test.module.courseId },
        select: { slug: true },
      });
      let enrolledStudents: { user: { id: string; name: string; email: string; avatar: string | null } }[] = [];
      if (course) {
        const enrolled = await db.enrollment.findMany({
          where: { courseId: course.slug, status: 'approved', deletedAt: null },
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        });
        // Deduplicate by userId (student might have multiple enrollments)
        const seen = new Set<string>();
        for (const e of enrolled) {
          if (!seen.has(e.userId)) {
            seen.add(e.userId);
            enrolledStudents.push({ user: e.user });
          }
        }
      }

      return NextResponse.json({ test, enrolledStudents });
    }

    // Return all tests with attempts and user info (for viewing grades)
    if (viewGrades === '1') {
      const tests = await db.moduleTest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          module: {
            select: { id: true, title: true },
          },
          attempts: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      return NextResponse.json({ tests });
    }

    // Default: return all tests with summary counts
    const tests = await db.moduleTest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true, attempts: true } },
        module: {
          select: { title: true },
        },
      },
    });

    const testsList = tests.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      timeLimit: t.timeLimit,
      passingScore: t.passingScore,
      questionCount: t._count.questions,
      attemptCount: t._count.attempts,
      moduleId: t.moduleId,
      moduleTitle: t.module.title,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({ tests: testsList });
  } catch (error) {
    console.error('Admin tests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const body = await request.json();
    const { moduleId, title, description, timeLimit, passingScore } = body;

    if (!moduleId || !title) {
      return NextResponse.json({ error: 'moduleId and title are required' }, { status: 400 });
    }

    // Verify module exists
    const module = await db.courseModule.findUnique({ where: { id: moduleId } });
    if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

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
    console.error('Admin tests create error:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const body = await request.json();
  const { action } = body;

  // ── ADD QUESTION ──
  if (action === 'addQuestion') {
    const { testId, questionText, options, correctAnswer, points } = body;

    if (!testId || !questionText || !Array.isArray(options)) {
      return NextResponse.json({ error: 'testId, questionText, and options are required' }, { status: 400 });
    }

    const test = await db.moduleTest.findUnique({ where: { id: testId } });
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

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

  // ── DELETE QUESTION ──
  if (action === 'deleteQuestion') {
    const { testId, questionId } = body;

    if (!testId || !questionId) {
      return NextResponse.json({ error: 'testId and questionId are required' }, { status: 400 });
    }

    await db.testQuestion.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ message: 'Question deleted' });
  }

  // ── UNLOCK TEST FOR USER ──
  if (action === 'unlock') {
    const { testId, userId } = body;

    if (!testId || !userId) {
      return NextResponse.json({ error: 'testId and userId are required' }, { status: 400 });
    }

    try {
      // Delete any existing completed attempts so student can retake from scratch
      await db.testAttempt.deleteMany({
        where: { testId, userId, submittedAt: { not: null } },
      }).catch(() => {});

      // Use upsert with compound unique key for reliability
      await db.testUnlock.upsert({
        where: { testId_userId: { testId, userId } },
        create: { testId, userId, unlockedBy: user.id },
        update: {}, // already unlocked, no-op
      });

      // Notify user
      const testInfo = await db.moduleTest.findUnique({ where: { id: testId } });
      if (testInfo) {
        await db.notification.create({
          data: {
            userId,
            title: 'Test Unlocked',
            message: `"${testInfo.title}" has been unlocked by an admin. You can now take the test.`,
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

  // ── LOCK TEST FOR USER ──
  if (action === 'lock') {
    const { testId, userId } = body;

    if (!testId || !userId) {
      return NextResponse.json({ error: 'testId and userId are required' }, { status: 400 });
    }

    try {
      // Find existing unlock by compound key
      const existing = await db.testUnlock.findUnique({
        where: { testId_userId: { testId, userId } },
      });

      if (!existing) {
        return NextResponse.json({ message: 'Test was not unlocked for this user' });
      }

      await db.testUnlock.delete({
        where: { id: existing.id },
      });

      // Also delete any in-progress attempts for this test+user
      await db.testAttempt.deleteMany({
        where: { testId, userId, submittedAt: null },
      }).catch(() => {});

      // Notify user
      const testInfo = await db.moduleTest.findUnique({ where: { id: testId } });
      if (testInfo) {
        await db.notification.create({
          data: {
            userId,
            title: 'Test Locked',
            message: `"${testInfo.title}" has been locked by an admin.`,
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

  // ── RESET SINGLE ATTEMPT ──
  if (action === 'resetAttempt') {
    const { testId, userId } = body;

    if (!testId || !userId) {
      return NextResponse.json({ error: 'testId and userId are required' }, { status: 400 });
    }

    await db.testAttempt.deleteMany({
      where: { testId, userId },
    });

    return NextResponse.json({ message: 'Attempt reset for user' });
  }

  // ── RESET ALL ATTEMPTS ──
  if (action === 'resetAllAttempts') {
    const { testId } = body;

    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }

    const result = await db.testAttempt.deleteMany({
      where: { testId },
    });

    return NextResponse.json({ message: `All attempts reset (${result.count} deleted)` });
  }

  // ── UPDATE TEST ──
  const { id, title, description, timeLimit, passingScore } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const existing = await db.moduleTest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

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
    console.error('Admin tests PUT error:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.moduleTest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    await db.moduleTest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Test deleted' });
  } catch (error) {
    console.error('Admin test delete error:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}
