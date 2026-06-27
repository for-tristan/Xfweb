import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    // Pre-compute the date thresholds used by the queries below so they
    // can all be fired in parallel without interdependencies.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

    // ── Parallelize all independent DB round-trips ──
    // Previously each await was sequential, so the total endpoint latency
    // was the SUM of 9 round-trips to libSQL. With Promise.all it's the
    // MAX (the slowest single query). None of these queries depends on
    // the result of any other.
    const [
      totalUsers,
      totalEnrollments,
      pendingEnrollments,
      approvedEnrollments,
      coursePopularity,
      recentEnrollments,
      recentActivity,
      usersThisWeek,
      usersLastWeek,
    ] = await Promise.all([
      db.user.count(),
      db.enrollment.count({ where: { deletedAt: null } }),
      db.enrollment.count({ where: { deletedAt: null, status: 'pending' } }),
      db.enrollment.count({ where: { deletedAt: null, status: 'approved' } }),
      db.enrollment.groupBy({
        by: ['courseId', 'courseName'],
        where: { deletedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      db.enrollment.findMany({
        where: { deletedAt: null, enrolledAt: { gte: sevenDaysAgo } },
        select: { enrolledAt: true, courseId: true, courseName: true, status: true },
        orderBy: { enrolledAt: 'asc' },
      }),
      db.enrollment.findMany({
        where: { deletedAt: null },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { enrolledAt: 'desc' },
        take: 10,
      }),
      db.user.count({ where: { createdAt: { gte: thisWeekStart } } }),
      db.user.count({ where: { createdAt: { gte: lastWeekStart, lt: thisWeekStart } } }),
    ]);

    // Build the daily-trends bucket from the (now-resolved) recentEnrollments.
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
