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

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a new verification code has been sent.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Your email is already verified. You can log in.',
      });
    }

    const code = randomInt(100000, 1000000).toString();

    await db.emailVerification.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    await db.emailVerification.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    let emailSent = false;
    try {
      emailSent = await sendEmailVerificationEmail({
        userEmail: user.email,
        name: user.name,
        code,
      });
    } catch (emailErr: any) {
      console.error('[ResendVerification] Email send failed:', emailErr?.message || emailErr);
    }

    return NextResponse.json({
      message: emailSent
        ? 'A new verification code has been sent to your email.'
        : 'Failed to send verification code. Please try again or contact support.',
      emailSent,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
