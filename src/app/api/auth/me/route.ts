import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, deleteAllUserSessions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendEmailVerificationEmail } from '@/lib/email';
import { randomInt } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // First try cookie-based auth (Chrome/Firefox/Safari)
    const user = await getCurrentUser();

    if (user) {
      if (!user.emailVerified) {
        await deleteAllUserSessions(user.id);

        const code = randomInt(100000, 1000000).toString();

        await db.emailVerification.updateMany({
          where: { email: user.email, used: false },
          data: { used: true },
        });

        await db.emailVerification.create({
          data: {
            email: user.email,
            code,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        try {
          await sendEmailVerificationEmail({
            userEmail: user.email,
            name: user.name,
            code,
          });
        } catch (emailErr: any) {
          console.error('[Auth/Me] Verification email send failed:', emailErr?.message || emailErr);
        }

        return NextResponse.json(
          {
            error: 'Email verification required. A verification code has been sent to your email.',
            needsVerification: true,
            email: user.email,
          },
          { status: 403 }
        );
      }

      return NextResponse.json({ user });
    }

    // Cookie auth failed — try token-based auth (Edge fallback)
    // The frontend sends the session token via a custom header
    const authToken = request.headers.get('x-foundry-token');
    const authUserId = request.headers.get('x-foundry-user-id');

    if (authToken && authUserId) {
      // Verify the session token exists in the database
      const session = await db.session.findUnique({
        where: { token: authToken },
      });

      if (session && session.userId === authUserId && session.expiresAt > new Date()) {
        // Session is valid — return the user
        const tokenUser = await db.user.findUnique({
          where: { id: authUserId },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            emailVerified: true,
            phone: true,
            company: true,
            avatar: true,
          },
        });

        if (tokenUser) {
          if (!tokenUser.emailVerified) {
            return NextResponse.json(
              {
                error: 'Email verification required.',
                needsVerification: true,
                email: tokenUser.email,
              },
              { status: 403 }
            );
          }

          return NextResponse.json({
            user: {
              ...tokenUser,
              username: tokenUser.username ?? '',
              emailVerified: tokenUser.emailVerified ?? null,
            },
          });
        }
      }
    }

    // No valid auth found
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
