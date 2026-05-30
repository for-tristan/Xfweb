import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game');
    const language = searchParams.get('language');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (game && game !== 'all') where.game = game;
    if (language && language !== 'all') where.language = language;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;

    // Get all matching scores with user info
    const scores = await db.gameScore.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { score: 'desc' },
        { timeSpent: 'asc' },
      ],
    });

    // Stack all scores per user — sum all attempts instead of keeping only the best
    const stackedMap = new Map<string, {
      userId: string;
      userName: string;
      userAvatar: string | null;
      totalScore: number;
      totalTimeSpent: number;
      totalCorrect: number;
      totalQuestions: number;
      gamesPlayed: number;
      bestGame: string;
      bestLanguage: string;
      bestDifficulty: string;
      lastCreatedAt: Date;
    }>();

    for (const s of scores) {
      const key = s.userId;
      const existing = stackedMap.get(key);
      if (existing) {
        // Stack: add scores and time from all attempts
        existing.totalScore += s.score;
        existing.totalTimeSpent += s.timeSpent;
        existing.totalCorrect += s.correct;
        existing.totalQuestions += s.total;
        existing.gamesPlayed += 1;
        // Track the best single game for display
        if (s.score > (existing.totalScore - s.score) / (existing.gamesPlayed - 1) * 1.5 || existing.gamesPlayed === 1) {
          existing.bestGame = s.game;
          existing.bestLanguage = s.language;
          existing.bestDifficulty = s.difficulty;
        }
        if (s.createdAt > existing.lastCreatedAt) {
          existing.lastCreatedAt = s.createdAt;
        }
      } else {
        stackedMap.set(key, {
          userId: s.userId,
          userName: s.user.name,
          userAvatar: s.user.avatar,
          totalScore: s.score,
          totalTimeSpent: s.timeSpent,
          totalCorrect: s.correct,
          totalQuestions: s.total,
          gamesPlayed: 1,
          bestGame: s.game,
          bestLanguage: s.language,
          bestDifficulty: s.difficulty,
          lastCreatedAt: s.createdAt,
        });
      }
    }

    // Sort by stacked total score desc, then by total time asc (less time = better)
    const leaderboard = [...stackedMap.values()]
      .sort((a, b) => b.totalScore - a.totalScore || a.totalTimeSpent - b.totalTimeSpent)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        userName: entry.userName,
        userAvatar: entry.userAvatar,
        game: entry.bestGame,
        language: entry.bestLanguage,
        difficulty: entry.bestDifficulty,
        score: entry.totalScore,
        correct: entry.totalCorrect,
        total: entry.totalQuestions,
        timeSpent: entry.totalTimeSpent,
        gamesPlayed: entry.gamesPlayed,
        createdAt: entry.lastCreatedAt,
      }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
