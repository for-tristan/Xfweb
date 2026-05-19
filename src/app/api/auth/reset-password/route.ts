import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find the reset code
    const resetRecord = await db.passwordReset.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code. Please request a new one.' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with that email' },
        { status: 404 }
      );
    }

    // Hash the new password and update the user
    const hashedPassword = hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Mark the code as used
    await db.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    // Invalidate all other unused codes for this email
    await db.passwordReset.updateMany({
      where: { email: email.toLowerCase().trim(), used: false },
      data: { used: true },
    });

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
