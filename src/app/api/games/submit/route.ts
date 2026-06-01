import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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

    const gameScore = await db.gameScore.create({
      data: {
        userId: user.id,
        game,
        language,
        difficulty,
        score: parseInt(score),
        correct: parseInt(correct),
        total: parseInt(total),
        timeSpent: parseInt(timeSpent),
      },
    });

    return NextResponse.json({ message: 'Score submitted!', score: gameScore });
  } catch (error) {
    console.error('Game score submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
