import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { testId, answers, startedAt } = body;

    if (!testId || !answers) {
      return NextResponse.json({ error: 'testId and answers are required' }, { status: 400 });
    }

  const unlock = await db.testUnlock.findUnique({
    where: { testId_userId: { testId, userId: user.id } },
  });

  if (!unlock) {
    return NextResponse.json({ error: 'Test is not unlocked for you. Contact admin.' }, { status: 403 });
  }

  const existingAttempt = await db.testAttempt.findUnique({
    where: { testId_userId: { testId, userId: user.id } },
  });

  if (existingAttempt && existingAttempt.submittedAt !== null) {
    return NextResponse.json(
      { error: 'You have already completed this test. Contact admin to reset.' },
      { status: 400 }
    );
  }

  const test = await db.moduleTest.findUnique({
    where: { id: testId },
    include: {
      questions: { orderBy: { questionOrder: 'asc' } },
    },
  });

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  if (test.questions.length === 0) {
    return NextResponse.json({ error: 'This test has no questions' }, { status: 400 });
  }

  let score = 0;
  let totalPoints = 0;
  const correctQuestionIds: string[] = [];

  for (const question of test.questions) {
    totalPoints += question.points;
    const selectedAnswer = Number(answers[question.id]);
    const correctAnswer = Number(question.correctAnswer);
    if (!isNaN(selectedAnswer) && !isNaN(correctAnswer) && selectedAnswer === correctAnswer) {
      score += question.points;
      correctQuestionIds.push(question.id);
    }
  }

  const scorePercentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
  const passed = scorePercentage >= test.passingScore;

  let startTime = new Date();
  if (startedAt) {
    const parsed = new Date(startedAt);
    const now = new Date();
    if (!isNaN(parsed.getTime()) && parsed <= now && (now.getTime() - parsed.getTime()) < 24 * 60 * 60 * 1000) {
      startTime = parsed;
    }
  }

  const attempt = await db.testAttempt.upsert({
    where: { testId_userId: { testId, userId: user.id } },
    create: {
      testId,
      userId: user.id,
      answers: JSON.stringify(answers),
      score,
      totalPoints,
      passed,
      startedAt: startTime,
      submittedAt: new Date(),
    },
    update: {
      answers: JSON.stringify(answers),
      score,
      totalPoints,
      passed,
      startedAt: startTime,
      submittedAt: new Date(),
    },
  });

  await logRequest(request, 'TEST_SUBMIT', {
    userId: user.id,
    email: user.email,
    details: `Submitted test "${test.title}" (testId: ${testId}). Score: ${score}/${totalPoints} (${Math.round(scorePercentage * 100) / 100}%), ${passed ? 'PASSED' : 'FAILED'} (passing threshold: ${test.passingScore}%)`,
    status: 200,
  });

  return NextResponse.json({
    success: true,
    score,
    totalPoints,
    passed,
    scorePercentage: Math.round(scorePercentage * 100) / 100,
    correctQuestionIds,
    attempt: {
      id: attempt.id,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
    },
  });
  } catch (error) {
    console.error('Test submit error:', error);
    await logRequest(request, 'TEST_SUBMIT_FAILED', {
      details: `Server error submitting test (testId: ${testId ?? 'unknown'}): ${(error as Error).message}`,
      status: 500,
    });
    return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
  }
}
