import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// SECURITY: This endpoint was previously unauthenticated + unthrottled.
// Combined with no input validation, it allowed anyone to:
//  - spam server logs (log injection / log poisoning)
//  - exfiltrate data via server logs as a side-channel
//  - probe internal paths via reflected stack traces
//  - fill disk with megabytes of attacker-controlled text
//
// Now requires auth (the client error boundary only fires for logged-in
// SPA usage anyway) + rate-limited at 10/min per IP via middleware +
// strict field length caps. Stack traces are also sanitized of common
// sensitive patterns before logging.

const MAX_FIELD_LEN = {
  message: 200,
  digest: 100,
  url: 500,
  userAgent: 300,
  timestamp: 50,
  stack: 1000,
};

function sanitize(text: string): string {
  if (!text) return '';
  // Strip common sensitive patterns from stack traces / messages
  // before they hit server logs.
  return text
    // File paths (catches /home/..., /var/..., /usr/..., C:\...)
    .replace(/(?:\/[\w.-]+)+\/?|[A-Za-z]:\\[\w\\.-]+/g, '[path]')
    // Environment variable references (process.env.X, %X%)
    .replace(/process\.env\.\w+|%\w+%/g, '[env]')
    // Long hex/base64 strings (potential tokens / secrets)
    .replace(/[a-f0-9]{32,}|[A-Za-z0-9+/]{40,}={0,2}/g, '[redacted]')
    .substring(0, MAX_FIELD_LEN.stack);
}

export async function POST(request: NextRequest) {
  try {
    // Require auth — prevents anonymous log spam.
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Strict length caps on every field — prevents disk-fill DoS.
    const cap = (val: unknown, max: number): string => {
      const s = typeof val === 'string' ? val : String(val ?? '');
      return s.substring(0, max);
    };

    console.error('[CLIENT ERROR]', {
      userId: user.id,
      message: cap(body?.message, MAX_FIELD_LEN.message),
      digest: cap(body?.digest, MAX_FIELD_LEN.digest),
      url: cap(body?.url, MAX_FIELD_LEN.url),
      userAgent: cap(body?.userAgent, MAX_FIELD_LEN.userAgent),
      timestamp: cap(body?.timestamp, MAX_FIELD_LEN.timestamp),
      stack: sanitize(cap(body?.stack, MAX_FIELD_LEN.stack)),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Don't leak internal errors — just acknowledge.
    console.error('[log-error endpoint failure]', error);
    return NextResponse.json({ ok: true });
  }
}
