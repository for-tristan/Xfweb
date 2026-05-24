import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    const clientId = process.env.GOOGLE_ID;
    const clientSecret = process.env.GOOGLE_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/?error=oauth_not_configured', request.url));
    }

    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectUri = `${proto}://${host}/api/auth/google/callback`;

    // Exchange code for tokens
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

    // Fetch Google user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser = await userRes.json();

    if (!gUser.email) {
      return NextResponse.redirect(new URL('/?error=no_email', request.url));
    }

    // Check for existing account link
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
      // Check if user exists with this email
      user = await db.user.findUnique({ where: { email: gUser.email } });

      if (user) {
        // Link the Google account to existing user
        await db.accountLink.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: gUser.id,
          },
        });
      } else {
        // Create new user
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
            password: hashPassword(`google_oauth_${Date.now()}_${Math.random()}`),
            username,
            avatar: gUser.picture || null,
            role: 'student',
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

    // Set session cookies
    const token = createSessionToken(user.id);
    const response = NextResponse.redirect(new URL('/', request.url));

    const secure = proto === 'https';

    response.cookies.set('xfoundry_session', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('xfoundry_user_id', user.id, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}
