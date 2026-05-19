import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

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

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a reset code has been sent.',
      });
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

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

    // Send the email (non-blocking, gracefully degrades)
    sendPasswordResetEmail({
      userEmail: user.email,
      name: user.name,
      code,
    }).catch(() => {});

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
