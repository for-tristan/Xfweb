import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const aggregated = await db.studySession.groupBy({
      by: ['userId'],
      where: {
        date: { gte: thirtyDaysAgoStr },
        courseId: 'general',
      },
      _sum: { duration: true },
      _count: { id: true },
      orderBy: { _sum: { duration: 'desc' } },
      take: 10,
    });

    const topUserIds = aggregated.map(a => a.userId);
    const users = await db.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, avatar: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const leaderboard = aggregated.map((entry, index) => {
      const u = userMap.get(entry.userId);
      const totalSeconds = entry._sum.duration || 0;
      return {
        rank: index + 1,
        userId: entry.userId,
        name: u?.name || 'Unknown',
        avatar: u?.avatar || null,
        totalSeconds,
        totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
        sessionsCount: entry._count.id,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
