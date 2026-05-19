import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null };
  if (user.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null };
  return { error: null, user };
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const totalUsers = await db.user.count();
    const totalEnrollments = await db.enrollment.count({ where: { deletedAt: null } });
    const pendingEnrollments = await db.enrollment.count({ where: { deletedAt: null, status: 'pending' } });
    const approvedEnrollments = await db.enrollment.count({ where: { deletedAt: null, status: 'approved' } });

    // Course popularity
    const coursePopularity = await db.enrollment.groupBy({
      by: ['courseId', 'courseName'],
      where: { deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Daily enrollment trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEnrollments = await db.enrollment.findMany({
      where: { deletedAt: null, enrolledAt: { gte: sevenDaysAgo } },
      select: { enrolledAt: true, courseId: true, courseName: true, status: true },
      orderBy: { enrolledAt: 'asc' },
    });

    const dailyTrends: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyTrends[key] = 0;
    }
    recentEnrollments.forEach((e) => {
      const key = e.enrolledAt.toISOString().split('T')[0];
      if (dailyTrends[key] !== undefined) dailyTrends[key]++;
    });

    // Recent activity (last 10)
    const recentActivity = await db.enrollment.findMany({
      where: { deletedAt: null },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { enrolledAt: 'desc' },
      take: 10,
    });

    // Users this week vs last week
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

    const usersThisWeek = await db.user.count({ where: { createdAt: { gte: thisWeekStart } } });
    const usersLastWeek = await db.user.count({ where: { createdAt: { gte: lastWeekStart, lt: thisWeekStart } } });

    return NextResponse.json({
      totalUsers,
      totalEnrollments,
      pendingEnrollments,
      approvedEnrollments,
      coursePopularity,
      dailyTrends,
      recentActivity,
      usersThisWeek,
      usersLastWeek,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
