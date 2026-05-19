import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured. Please set GOOGLE_ID and GOOGLE_SECRET in .env' },
      { status: 500 }
    );
  }

  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
