import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
import { sendEmailVerificationEmail } from '@/lib/email';
import { randomInt } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
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

      let emailSent = false;
      try {
        emailSent = await sendEmailVerificationEmail({
          userEmail: user.email,
          name: user.name,
          code,
        });
      } catch (emailErr: any) {
        console.error('[Login] Verification email send failed:', emailErr?.message || emailErr);
      }

      return NextResponse.json(
        {
          error: emailSent
            ? 'Please verify your email address before logging in'
            : 'We could not send the verification code. Please click "Resend Code" below.',
          needsVerification: true,
          email: user.email,
          emailSent,
        },
        { status: 403 }
      );
    }

    const token = await createSession(user.id);

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        phone: user.phone,
        company: user.company,
        avatar: user.avatar,
      },
    });

    const secure = process.env.NODE_ENV === 'production';

    // Use sameSite: 'lax' — this works for same-site requests (which is
    // what we have on Vercel). 'none' was tried for Edge but actually
    // makes things worse (Edge InPrivate blocks 'none' cookies too).
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

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
