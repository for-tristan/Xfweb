import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendEmailVerificationEmail } from '@/lib/email';
import { randomInt } from 'crypto';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function generateUsername(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
  return base || 'user';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, company, username: providedUsername } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    let username = providedUsername?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    if (!username) {
      username = generateUsername(name);
    }

    let usernameExists = await db.user.findUnique({ where: { username } });
    const baseUsername = username;
    while (usernameExists) {
      const suffix = randomInt(1000, 9999);
      username = `${baseUsername}${suffix}`;
      usernameExists = await db.user.findUnique({ where: { username } });
    }

    const hashedPassword = hashPassword(password);

    try {
      const user = await db.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          username,
          phone: phone || null,
          company: company || null,
          role: 'newcomer',
        },
      });

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

      try {
        await sendEmailVerificationEmail({
          userEmail: user.email,
          name: user.name,
          code,
        });
      } catch (emailErr: any) {
        console.error('[Signup] Email send failed:', emailErr?.message || emailErr);
      }

      return NextResponse.json({
        message: 'Account created. Please check your email for a verification code.',
        requiresVerification: true,
        email: user.email,
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

    } catch (createError: any) {
      if (createError?.code === 'P2002') {
        const target = createError?.meta?.target as string[] | undefined;
        if (target?.includes('email')) {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 409 }
          );
        }
        if (target?.includes('username')) {
          return NextResponse.json(
            { error: 'This username is already taken. Please try another.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'An account with this information already exists' },
          { status: 409 }
        );
      }
      throw createError;
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
