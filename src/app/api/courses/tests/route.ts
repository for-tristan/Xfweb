import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Fetch all test unlocks for this user with full test + module + questions data
    const unlocks = await db.testUnlock.findMany({
      where: { userId: user.id },
      include: {
        test: {
          include: {
            module: {
              select: { id: true, title: true, moduleOrder: true },
            },
            questions: { orderBy: { questionOrder: 'asc' } },
            attempts: {
              where: { userId: user.id },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tests = unlocks.map((unlock) => {
      const test = unlock.test;
      const attempt = test.attempts.length > 0 ? test.attempts[0] : null;
      const hasCompleted = attempt !== null && attempt.submittedAt !== null;

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        timeLimit: test.timeLimit,
        passingScore: test.passingScore,
        questionCount: test.questions.length,
        moduleId: test.moduleId,
        moduleTitle: test.module.title,
        moduleOrder: test.module.moduleOrder,
        questions: test.questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          options: JSON.parse(q.options),
          questionType: q.questionType,
          points: q.points,
          questionOrder: q.questionOrder,
        })),
        hasCompleted,
        attempt: hasCompleted && attempt
          ? {
              score: attempt.score,
              totalPoints: attempt.totalPoints,
              passed: attempt.passed,
              submittedAt: attempt.submittedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Course tests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
