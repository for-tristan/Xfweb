import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const verification = await db.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please request a new one.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with that email' },
        { status: 404 }
      );
    }

    await db.$transaction([
      db.emailVerification.update({
        where: { id: verification.id },
        data: { used: true },
      }),
      db.emailVerification.updateMany({
        where: { email: normalizedEmail, used: false },
        data: { used: true },
      }),
      db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
    ]);

    const token = await createSession(user.id);

    const response = NextResponse.json({
      message: 'Email verified successfully',
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

    response.cookies.set('xfoundry_session', token, {
      httpOnly: true,
      secure,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      maxAge: 60 * 60 * 24 * 3,
      path: '/',
    });

    response.cookies.set('xfoundry_user_id', user.id, {
      httpOnly: true,
      secure,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      maxAge: 60 * 60 * 24 * 3,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const code = searchParams.get('code');

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const verification = await db.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return NextResponse.redirect(new URL('/?verification=failed', request.url));
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/?verification=failed', request.url));
    }

    await db.$transaction([
      db.emailVerification.update({
        where: { id: verification.id },
        data: { used: true },
      }),
      db.emailVerification.updateMany({
        where: { email: normalizedEmail, used: false },
        data: { used: true },
      }),
      db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
    ]);

    const token = await createSession(user.id);

    const response = NextResponse.redirect(new URL('/?verification=success', request.url));

    const secure = process.env.NODE_ENV === 'production';

    response.cookies.set('xfoundry_session', token, {
      httpOnly: true,
      secure,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      maxAge: 60 * 60 * 24 * 3,
      path: '/',
    });

    response.cookies.set('xfoundry_user_id', user.id, {
      httpOnly: true,
      secure,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      maxAge: 60 * 60 * 24 * 3,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify email (GET) error:', error);
    return NextResponse.redirect(new URL('/?verification=failed', request.url));
  }
}
