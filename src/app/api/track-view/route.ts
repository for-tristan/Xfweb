import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

/**
 * Page view tracking endpoint.
 *
 * Called by a client-side beacon on every page navigation.
 * Logs the view with the current user (if any) + IP + path.
 * This captures BOTH anonymous visitors and authenticated users.
 *
 * The beacon is fire-and-forget — errors here don't affect the user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = body.path || '/';

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
