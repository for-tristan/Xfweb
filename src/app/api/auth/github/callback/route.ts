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

    const clientId = process.env.GITHUB_ID;
    const clientSecret = process.env.GITHUB_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/?error=oauth_not_configured', request.url));
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('GitHub token error:', tokenData);
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    // Fetch GitHub user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghUser = await userRes.json();

    // Fetch GitHub emails
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghEmails = await emailRes.json();
    const primaryEmail = ghEmails.find((e: { primary: boolean }) => e.primary)?.email || ghEmails[0]?.email;

    if (!primaryEmail) {
      return NextResponse.redirect(new URL('/?error=no_email', request.url));
    }

    // Check for existing account link
    const existingLink = await db.accountLink.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'github',
          providerAccountId: String(ghUser.id),
        },
      },
      include: { user: true },
    });

    let user;

    if (existingLink) {
      // Link exists, log in the linked user
      user = existingLink.user;
    } else {
      // Check if user exists with this email
      user = await db.user.findUnique({ where: { email: primaryEmail } });

      if (user) {
        // Link the GitHub account to existing user
        await db.accountLink.create({
          data: {
            userId: user.id,
            provider: 'github',
            providerAccountId: String(ghUser.id),
          },
        });
      } else {
        // Create new user
        const baseUsername = ghUser.login
          ? `gh_${ghUser.login.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 15)}`
          : `gh_${String(ghUser.id)}`;

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
            name: ghUser.name || ghUser.login || 'GitHub User',
            email: primaryEmail,
            password: hashPassword(`gh_oauth_${Date.now()}_${Math.random()}`),
            username,
            avatar: ghUser.avatar_url || null,
            role: 'student',
          },
        });

        await db.accountLink.create({
          data: {
            userId: user.id,
            provider: 'github',
            providerAccountId: String(ghUser.id),
          },
        });
      }
    }

    if (!user) {
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    // Set session cookies (same pattern as login route)
    const token = createSessionToken(user.id);
    const response = NextResponse.redirect(new URL('/', request.url));

    const proto = request.headers.get('x-forwarded-proto') || 'http';
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
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}
