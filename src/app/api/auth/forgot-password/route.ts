import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
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

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a reset code has been sent.',
      });
    }

    const code = randomInt(100000, 1000000).toString();

    await db.passwordReset.updateMany({
      where: { email: email.toLowerCase().trim(), used: false },
      data: { used: true },
    });

    await db.passwordReset.create({
      data: {
        email: email.toLowerCase().trim(),
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    try {
      await sendPasswordResetEmail({
        userEmail: user.email,
        name: user.name,
        code,
      });
    } catch (emailErr: any) {
      console.error('[ForgotPassword] Email send failed:', emailErr?.message || emailErr);
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a reset code has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
