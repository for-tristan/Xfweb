import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Aggregate total study time per user in the last 30 days for 'general' courseId
    const sessions = await db.studySession.findMany({
      where: {
        date: {
          gte: thirtyDaysAgoStr,
        },
        courseId: 'general',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Aggregate by user
    const userMap: Record<
      string,
      {
        userId: string;
        name: string;
        avatar: string | null;
        totalDuration: number;
        sessionsCount: number;
      }
    > = {};

    for (const s of sessions) {
      if (!userMap[s.userId]) {
        userMap[s.userId] = {
          userId: s.userId,
          name: s.user.name,
          avatar: s.user.avatar,
          totalDuration: 0,
          sessionsCount: 0,
        };
      }
      userMap[s.userId].totalDuration += s.duration;
      userMap[s.userId].sessionsCount += 1;
    }

    // Convert to array, sort by total duration desc, take top 10
    const leaderboard = Object.values(userMap)
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        name: entry.name,
        avatar: entry.avatar,
        totalSeconds: entry.totalDuration,
        totalHours: Math.round((entry.totalDuration / 3600) * 100) / 100,
        sessionsCount: entry.sessionsCount,
      }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
