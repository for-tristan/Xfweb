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

    // Find user by email (normalized)
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a reset code has been sent.',
      });
    }

    // SECURITY: Use crypto.randomInt instead of Math.random for secure code generation
    const code = randomInt(100000, 1000000).toString();

    // Invalidate any previous reset codes for this email
    await db.passwordReset.updateMany({
      where: { email: email.toLowerCase().trim(), used: false },
      data: { used: true },
    });

    // Store the reset code with 15-minute expiry
    await db.passwordReset.create({
      data: {
        email: email.toLowerCase().trim(),
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Send email BEFORE returning response.
    // IMPORTANT: On Vercel serverless, after() does NOT keep the function alive —
    // the email send gets killed before it completes. We MUST await it here.
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
