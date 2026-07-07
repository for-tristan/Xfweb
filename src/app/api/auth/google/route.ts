import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured. Please set GOOGLE_ID and GOOGLE_SECRET in .env' },
      { status: 500 }
    );
  }

  // SECURITY: Never derive baseUrl from the Host header — it's
  // attacker-controllable and enables OAuth code theft via host-header
  // injection. Require NEXT_PUBLIC_BASE_URL to be set explicitly.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'OAuth is not configured. NEXT_PUBLIC_BASE_URL must be set in the environment.' },
      { status: 500 }
    );
  }
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const state = randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);

  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}
