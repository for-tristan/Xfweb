import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmailVerificationEmail } from '@/lib/email';
import { randomInt } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a new verification code has been sent.',
      });
    }

    // If already verified, no need to resend
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Your email is already verified. You can log in.',
      });
    }

    // Generate a new 6-digit verification code
    const code = randomInt(100000, 1000000).toString();

    // Invalidate any previous verification codes for this email
    await db.emailVerification.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Store the new code with 24-hour expiry
    await db.emailVerification.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send email BEFORE returning response.
    // IMPORTANT: On Vercel serverless, after() does NOT keep the function alive —
    // the email send gets killed before it completes. We MUST await it here.
    try {
      await sendEmailVerificationEmail({
        userEmail: user.email,
        name: user.name,
        code,
      });
    } catch (emailErr: any) {
      console.error('[ResendVerification] Email send failed:', emailErr?.message || emailErr);
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a new verification code has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
