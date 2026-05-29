import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendEmailVerificationEmail } from '@/lib/email';
import { randomInt } from 'crypto';

// Email validation regex
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

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // SECURITY: Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // SECURITY: Password complexity requirements
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` },
        { status: 400 }
      );
    }

    // SECURITY: Password must contain uppercase, lowercase, and a number
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

    // SECURITY: Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate unique username
    let username = providedUsername?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    if (!username) {
      username = generateUsername(name);
    }

    // SECURITY: Ensure uniqueness with crypto-secure random suffix
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
          role: 'student', // SECURITY: Always 'student' — admin promotion is done via admin panel only
        },
      });

      // Generate a 6-digit verification code
      const code = randomInt(100000, 1000000).toString();

      // Invalidate any previous verification codes for this email
      await db.emailVerification.updateMany({
        where: { email: normalizedEmail, used: false },
        data: { used: true },
      });

      // Store the verification code with 24-hour expiry
      await db.emailVerification.create({
        data: {
          email: normalizedEmail,
          code,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Send verification email BEFORE returning response.
      // IMPORTANT: On Vercel serverless, after() does NOT keep the function alive —
      // the email send gets killed before it completes. We MUST await it here.
      try {
        await sendEmailVerificationEmail({
          userEmail: user.email,
          name: user.name,
          code,
        });
      } catch (emailErr: any) {
        console.error('[Signup] Email send failed:', emailErr?.message || emailErr);
        // Don't fail signup — user can resend verification code later
      }

      // Return response WITHOUT session cookies — user must verify email first
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
      // Race condition: another request created the user between our check and insert
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
