import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_ID;
  const clientSecret = process.env.GITHUB_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'GitHub OAuth is not configured. Please set GITHUB_ID and GITHUB_SECRET in .env' },
      { status: 500 }
    );
  }

  const host = request.headers.get('host');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `https://${host}` : 'http://localhost:3000');
  const redirectUri = `${baseUrl}/api/auth/github/callback`;

  const state = randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:email read:user',
    state,
  });

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);

  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}
