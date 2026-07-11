import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * Admin activity logs endpoint.
 *
 * Supports filtering by:
 * - action (e.g. 'LOGIN_SUCCESS', 'ADMIN_USER_ROLE_CHANGE')
 * - email (user email)
 * - ip (client IP)
 * - search (fuzzy match on email, action, details, ip)
 *
 * Returns paginated results, newest first. Includes a `total` count
 * for pagination UI.
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
    const action = url.searchParams.get('action')?.trim() || '';
    const email = url.searchParams.get('email')?.trim() || '';
    const ip = url.searchParams.get('ip')?.trim() || '';
    const search = url.searchParams.get('search')?.trim() || '';

    const where: any = {};

    if (action) {
      where.action = { contains: action };
    }
    if (email) {
      where.email = { contains: email };
    }
    if (ip) {
      where.ip = { contains: ip };
    }
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { action: { contains: search } },
        { details: { contains: search } },
        { ip: { contains: search } },
        { path: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error('Admin logs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
