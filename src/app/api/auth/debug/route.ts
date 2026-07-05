import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Debug endpoint to trace Edge sign-in issues.
 * Returns what cookies were received, what getCurrentUser returns,
 * and whether the session is valid.
 */
export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll();
  const user = await getCurrentUser();

  return NextResponse.json({
    cookiesReceived: cookies.map(c => ({ name: c.name, hasValue: !!c.value })),
    userFound: !!user,
    user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
  });
}
