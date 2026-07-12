import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

/**
 * Page view tracking endpoint.
 *
 * Called by a client-side beacon on every page navigation.
 * Logs the view with the current user (if any) + IP + path.
 * This captures BOTH anonymous visitors and authenticated users.
 *
 * SECURITY:
 * - Path is capped at 500 chars (prevents log flooding with huge strings)
 * - Path is validated to start with / (prevents arbitrary data injection)
 * - API routes and Next.js internal routes are skipped
 * - Rate limited via middleware (10 req/min per IP)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let path = typeof body.path === 'string' ? body.path : '/';

    // Validate path: must start with /, cap at 500 chars
    if (!path.startsWith('/')) path = '/';
    path = path.substring(0, 500);

    // Don't log API calls or static asset requests
    if (path.startsWith('/api/') || path.startsWith('/_next/')) {
      return NextResponse.json({ ok: true });
    }

    const user = await getCurrentUser().catch(() => null);

    await logRequest(request, 'PAGE_VIEW', {
      userId: user?.id,
      email: user?.email,
      details: `Page view: ${path}`,
      status: 200,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
