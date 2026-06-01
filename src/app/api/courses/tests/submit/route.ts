import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { testId, answers, startedAt } = body;

    if (!testId || !answers) {
      return NextResponse.json({ error: 'testId and answers are required' }, { status: 400 });
    }

  // Verify the test is unlocked for this user
  const unlock = await db.testUnlock.findUnique({
    where: { testId_userId: { testId, userId: user.id } },
  });

  if (!unlock) {
    return NextResponse.json({ error: 'Test is not unlocked for you. Contact admin.' }, { status: 403 });
  }

  // Check if student already has a completed attempt
  const existingAttempt = await db.testAttempt.findUnique({
    where: { testId_userId: { testId, userId: user.id } },
  });

  if (existingAttempt && existingAttempt.submittedAt !== null) {
    return NextResponse.json(
      { error: 'You have already completed this test. Contact admin to reset.' },
      { status: 400 }
    );
  }

  // Fetch the test with all questions
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

  // Grade the test
  let score = 0;
  let totalPoints = 0;
  const correctQuestionIds: string[] = [];

  for (const question of test.questions) {
    totalPoints += question.points;
    // Use Number() to handle type mismatches — Turso/libSQL may return integers as strings
    const selectedAnswer = Number(answers[question.id]);
    const correctAnswer = Number(question.correctAnswer);
    if (!isNaN(selectedAnswer) && !isNaN(correctAnswer) && selectedAnswer === correctAnswer) {
      score += question.points;
      correctQuestionIds.push(question.id);
    }
  }

  const scorePercentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
  const passed = scorePercentage >= test.passingScore;

  // Parse the client-sent start time (when the student actually began the test)
  // Falls back to current time if not provided (backward compat)
  // SECURITY: Validate startedAt is not in the future and not more than 24h ago
  let startTime = new Date();
  if (startedAt) {
    const parsed = new Date(startedAt);
    const now = new Date();
    if (!isNaN(parsed.getTime()) && parsed <= now && (now.getTime() - parsed.getTime()) < 24 * 60 * 60 * 1000) {
      startTime = parsed;
    }
  }

  // Create or update the attempt
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
    return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
  }
}
