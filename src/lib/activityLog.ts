import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

/**
 * Activity logging utility for the admin audit trail.
 *
 * Logs every meaningful user action with:
 * - userId (null for unauthenticated actions like signup attempts)
 * - email (captured even for unverified users — the whole point)
 * - action (e.g. 'LOGIN_SUCCESS', 'COURSE_ENROLL', 'ADMIN_ROLE_CHANGE')
 * - details (freeform string with context)
 * - method + path (HTTP method + URL path)
 * - ip (client IP from x-forwarded-for)
 * - userAgent (browser/client identification)
 * - status (HTTP response status code)
 *
 * All log calls are wrapped in try/catch — logging failures must NEVER
 * break the user's request.
 */

export interface ActivityLogParams {
  userId?: string | null;
  email?: string | null;
  action: string;
  details?: string;
  method?: string;
  path?: string;
  ip?: string | null;
  userAgent?: string | null;
  status?: number;
}

export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        userId: params.userId || null,
        email: params.email || null,
        action: params.action,
        details: params.details || null,
        method: params.method || 'GET',
        path: params.path || '',
        ip: params.ip || null,
        userAgent: params.userAgent || null,
        status: params.status || null,
      },
    });
  } catch (e) {
    // Don't let logging failures break the app
    console.error('[activityLog] Failed to log:', e);
  }
}

/**
 * Convenience wrapper that extracts IP, user-agent, method, and path
 * from a NextRequest automatically. The caller just provides the
 * action + optional details/user/status.
 */
export async function logRequest(
  request: NextRequest,
  action: string,
  options?: {
    userId?: string | null;
    email?: string | null;
    details?: string;
    status?: number;
  }
): Promise<void> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  // Extract device ID from cookie so it shows in the logs
  const deviceId = request.cookies.get('xfoundry_device_id')?.value || '';
  let path: string;
  try {
    path = new URL(request.url).pathname;
  } catch {
    path = request.url || '';
  }

  // Append device ID to details so admins can see it in the logs
  // without needing a schema migration. Format: [device:abc123...]
  const baseDetails = options?.details || '';
  const deviceTag = deviceId ? ` [device: ${deviceId.substring(0, 16)}...]` : '';
  const details = baseDetails + deviceTag;

  await logActivity({
    userId: options?.userId,
    email: options?.email,
    action,
    details,
    method: request.method,
    path,
    ip,
    userAgent,
    status: options?.status,
  });
}
