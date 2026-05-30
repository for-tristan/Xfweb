import { NextResponse } from 'next/server';
import { getCurrentUser, deleteAllUserSessions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendEmailVerificationEmail } from '@/lib/email';
import { randomInt } from 'crypto';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // ── Email Verification Gate ──
    // If the user's email is not verified (emailVerified is null),
    // force them to verify before they can access the site.
    // This handles existing users who were created before the
    // email verification system was added.
    if (!user.emailVerified) {
      // Delete all sessions to force logout
      await deleteAllUserSessions(user.id);

      // Generate a new 6-digit verification code
      const code = randomInt(100000, 1000000).toString();

      // Invalidate previous unused codes
      await db.emailVerification.updateMany({
        where: { email: user.email, used: false },
        data: { used: true },
      });

      // Store new verification code
      await db.emailVerification.create({
        data: {
          email: user.email,
          code,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Send verification email (best effort — don't block on failure)
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
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
