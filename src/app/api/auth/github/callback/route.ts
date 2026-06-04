import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    // SECURITY: Verify state parameter to prevent CSRF
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
    const primaryEmailObj = ghEmails.find((e: { primary: boolean; verified: boolean }) => e.primary);
    const primaryEmail = primaryEmailObj?.email || ghEmails[0]?.email;
    const isEmailVerified = primaryEmailObj?.verified || ghEmails[0]?.verified || false;

    if (!primaryEmail) {
      return NextResponse.redirect(new URL('/?error=no_email', request.url));
    }

    // SECURITY: GitHub allows unverified emails. Require a verified email to proceed.
    if (!isEmailVerified) {
      return NextResponse.redirect(new URL('/?error=email_not_verified', request.url));
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
      // Check if user exists with this email — link if found
      user = await db.user.findUnique({ where: { email: primaryEmail } });

      if (user) {
        // SECURITY: Do NOT auto-link by email. This prevents account takeover attacks
        // where an attacker adds a victim's email to their GitHub account.
        // Users must link accounts manually via account settings (with password confirmation).
        const response = NextResponse.redirect(
          new URL('/?error=account_link_required&provider=github', request.url)
        );
        // Clear the OAuth state cookie
        response.cookies.set('oauth_state', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/',
        });
        return response;
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

        // SECURITY: Use randomBytes for placeholder password instead of Math.random
        // SECURITY: GitHub email is verified (checked above), so set emailVerified
        user = await db.user.create({
          data: {
            name: ghUser.name || ghUser.login || 'GitHub User',
            email: primaryEmail,
            password: hashPassword(`gh_oauth_${Date.now()}_${randomBytes(16).toString('hex')}`),
            username,
            avatar: ghUser.avatar_url || null,
            role: 'student',
            emailVerified: new Date(), // GitHub email is verified (checked above)
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

    // Set session cookies using the new createSession helper
    const token = await createSession(user.id);
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

    // Clear the OAuth state cookie
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
