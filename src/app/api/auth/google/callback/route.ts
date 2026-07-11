import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    const cookieStore = request.cookies;
    const storedState = cookieStore.get('oauth_state')?.value;
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(new URL('/?error=oauth_csrf', request.url));
    }

    const clientId = process.env.GOOGLE_ID;
    const clientSecret = process.env.GOOGLE_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/?error=oauth_not_configured', request.url));
    }

    // SECURITY: Never derive baseUrl from Host header (host-header injection
    // → OAuth code theft). Require NEXT_PUBLIC_BASE_URL explicitly.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.redirect(new URL('/?error=oauth_not_configured', request.url));
    }
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Google token error:', tokenData);
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser = await userRes.json();

    if (!gUser.email) {
      return NextResponse.redirect(new URL('/?error=no_email', request.url));
    }

    const existingLink = await db.accountLink.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: gUser.id,
        },
      },
      include: { user: true },
    });

    let user;

    if (existingLink) {
      user = existingLink.user;
    } else {
      user = await db.user.findUnique({ where: { email: gUser.email } });

      if (user) {
        const response = NextResponse.redirect(
          new URL('/?error=account_link_required&provider=google', request.url)
        );
        response.cookies.set('oauth_state', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/',
        });
        return response;
      } else {
        const name = gUser.name || 'Google User';
        const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
        const baseUsername = baseName || 'user';
        let username = baseUsername;
        let usernameExists = await db.user.findUnique({ where: { username } });
        let suffix = 1;
        while (usernameExists) {
          username = `${baseUsername}${suffix}`;
          usernameExists = await db.user.findUnique({ where: { username } });
          suffix++;
        }

        user = await db.user.create({
          data: {
            name,
            email: gUser.email,
            password: hashPassword(`google_oauth_${Date.now()}_${randomBytes(16).toString('hex')}`),
            username,
            avatar: gUser.picture || null,
            role: 'student',
            emailVerified: new Date(),
          },
        });

        await db.accountLink.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: gUser.id,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    const token = await createSession(user.id);

    await logRequest(request, 'OAUTH_GOOGLE_LOGIN', {
      userId: user.id,
      email: user.email,
      details: `Google OAuth login. Role: ${user.role}`,
      status: 200,
    });

    const response = NextResponse.redirect(new URL('/', request.url));

    const secure = process.env.NODE_ENV === 'production';

    response.cookies.set('xfoundry_session', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 3,
      path: '/',
    });

    response.cookies.set('xfoundry_user_id', user.id, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 3,
      path: '/',
    });

    response.cookies.set('oauth_state', '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}
