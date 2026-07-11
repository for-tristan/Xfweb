import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';
import { randomBytes } from 'crypto';
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

    const clientId = process.env.GITHUB_ID;
    const clientSecret = process.env.GITHUB_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/?error=oauth_not_configured', request.url));
    }

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

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghUser = await userRes.json();

    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghEmails = await emailRes.json();
    // SECURITY: Require the PRIMARY email to be VERIFIED. Previously this
    // used `primaryEmailObj?.verified || ghEmails[0]?.verified` — the OR
    // meant an attacker with a GitHub account whose primary email is
    // UNverified but who has ANY other verified email could register
    // using the unverified primary email, then take over that email slot
    // in Xfweb. Now we require primary AND verified on the same object.
    const primaryVerifiedEmail = ghEmails.find(
      (e: { primary: boolean; verified: boolean }) => e.primary && e.verified
    );

    if (!primaryVerifiedEmail?.email) {
      return NextResponse.redirect(new URL('/?error=email_not_verified', request.url));
    }

    const primaryEmail = primaryVerifiedEmail.email;

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
      user = existingLink.user;
    } else {
      user = await db.user.findUnique({ where: { email: primaryEmail } });

      if (user) {
        const response = NextResponse.redirect(
          new URL('/?error=account_link_required&provider=github', request.url)
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
            password: hashPassword(`gh_oauth_${Date.now()}_${randomBytes(16).toString('hex')}`),
            username,
            avatar: ghUser.avatar_url || null,
            role: 'student',
            emailVerified: new Date(),
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

    const token = await createSession(user.id);

    await logRequest(request, 'OAUTH_GITHUB_LOGIN', {
      userId: user.id,
      email: user.email,
      details: `GitHub OAuth login. Role: ${user.role}`,
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
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}
