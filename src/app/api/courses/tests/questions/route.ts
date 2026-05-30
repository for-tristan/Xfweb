import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }

    // Verify student has the test unlocked
    const testUnlock = await db.testUnlock.findUnique({
      where: { testId_userId: { testId, userId: user.id } },
    });

    if (!testUnlock) {
      return NextResponse.json({ error: 'Test is not unlocked' }, { status: 403 });
    }

    // Fetch the test with questions (exclude correctAnswer for security)
    const test = await db.moduleTest.findUnique({
      where: { id: testId },
      include: {
        questions: {
          orderBy: { questionOrder: 'asc' },
          select: {
            id: true,
            questionText: true,
            questionType: true,
            questionOrder: true,
            options: true,
            points: true,
          },
        },
      },
    });

    if (!test || test.status !== 'active') {
      return NextResponse.json({ error: 'Test not found or inactive' }, { status: 404 });
    }

    // Parse options from JSON string
    const questions = test.questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    }));

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        timeLimit: test.timeLimit,
        passingScore: test.passingScore,
      },
      questions,
    });
  } catch (error) {
    console.error('Student test questions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
