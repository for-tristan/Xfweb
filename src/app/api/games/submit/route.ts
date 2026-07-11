import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { game, language, difficulty, score, correct, total, timeSpent } = body;

    if (!game || !language || !difficulty || score === undefined || correct === undefined || !total || timeSpent === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['bug-hunter', 'whats-output', 'code-completion'].includes(game)) {
      return NextResponse.json({ error: 'Invalid game' }, { status: 400 });
    }

    if (!['python', 'javascript', 'java', 'cpp', 'css', 'html'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
    }

    const numScore = parseInt(score);
    const numCorrect = parseInt(correct);
    const numTotal = parseInt(total);
    const numTimeSpent = parseInt(timeSpent);

    if (isNaN(numScore) || isNaN(numCorrect) || isNaN(numTotal) || isNaN(numTimeSpent)) {
      return NextResponse.json({ error: 'Score, correct, total, and timeSpent must be numbers' }, { status: 400 });
    }
    if (numScore < 0 || numCorrect < 0 || numTotal <= 0 || numTimeSpent < 0) {
      return NextResponse.json({ error: 'Invalid score values' }, { status: 400 });
    }
    if (numCorrect > numTotal) {
      return NextResponse.json({ error: 'Correct answers cannot exceed total' }, { status: 400 });
    }

    const gameScore = await db.gameScore.create({
      data: {
        userId: user.id,
        game,
        language,
        difficulty,
        score: numScore,
        correct: numCorrect,
        total: numTotal,
        timeSpent: numTimeSpent,
      },
    });

    await logRequest(request, 'GAME_SCORE_SUBMIT', {
      userId: user.id,
      email: user.email,
      details: `Submitted game score (game: ${game}, language: ${language}, difficulty: ${difficulty}, score: ${numScore}, correct: ${numCorrect}/${numTotal}, timeSpent: ${numTimeSpent}s, scoreId: ${gameScore.id})`,
      status: 200,
    });

    return NextResponse.json({ message: 'Score submitted!', score: gameScore });
  } catch (error) {
    console.error('Game score submit error:', error);
    await logRequest(request, 'GAME_SCORE_SUBMIT_FAILED', {
      details: `Server error: ${(error as Error).message}`,
      status: 500,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
