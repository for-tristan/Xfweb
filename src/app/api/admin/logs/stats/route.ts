import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * Activity log stats — visitor counts for the admin dashboard.
 *
 * Returns:
 * - totalPageViews (all time)
 * - pageViewsToday
 * - uniqueVisitorsToday (distinct IPs)
 * - uniqueVisitorsTotal (distinct IPs all time)
 * - totalLogs
 * - logsToday
 * - topPages (top 10 most viewed pages today)
 * - topIps (top 10 most active IPs today)
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalPageViews,
      pageViewsToday,
      uniqueVisitorsToday,
      uniqueVisitorsTotal,
      totalLogs,
      logsToday,
    ] = await Promise.all([
      db.activityLog.count({ where: { action: 'PAGE_VIEW' } }),
      db.activityLog.count({
        where: { action: 'PAGE_VIEW', createdAt: { gte: startOfDay } },
      }),
      db.activityLog.findMany({
        where: { action: 'PAGE_VIEW', createdAt: { gte: startOfDay } },
        select: { ip: true },
        distinct: ['ip'],
      }),
      db.activityLog.findMany({
        where: { action: 'PAGE_VIEW' },
        select: { ip: true },
        distinct: ['ip'],
      }),
      db.activityLog.count(),
      db.activityLog.count({ where: { createdAt: { gte: startOfDay } } }),
    ]);

    // Top pages today (extract path from details field)
    const todayPageViews = await db.activityLog.findMany({
      where: { action: 'PAGE_VIEW', createdAt: { gte: startOfDay } },
      select: { details: true },
      take: 5000,
    });
    const pageCounts: Record<string, number> = {};
    for (const log of todayPageViews) {
      const match = log.details?.match(/Page view: (.+)/);
      const path = match?.[1] || 'unknown';
      pageCounts[path] = (pageCounts[path] || 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Top IPs today
    const todayIps = await db.activityLog.findMany({
      where: { createdAt: { gte: startOfDay } },
      select: { ip: true, email: true },
      take: 5000,
    });
    const ipCounts: Record<string, { count: number; email?: string }> = {};
    for (const log of todayIps) {
      if (!log.ip) continue;
      if (!ipCounts[log.ip]) {
        ipCounts[log.ip] = { count: 0, email: log.email || undefined };
      }
      ipCounts[log.ip].count++;
      if (!ipCounts[log.ip].email && log.email) {
        ipCounts[log.ip].email = log.email;
      }
    }
    const topIps = Object.entries(ipCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([ip, data]) => ({ ip, count: data.count, email: data.email }));

    return NextResponse.json({
      totalPageViews,
      pageViewsToday,
      uniqueVisitorsToday: uniqueVisitorsToday.length,
      uniqueVisitorsTotal: uniqueVisitorsTotal.length,
      totalLogs,
      logsToday,
      topPages,
      topIps,
    });
  } catch (error) {
    console.error('Admin log stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
