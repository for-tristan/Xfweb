import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';

function generateUsername(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
  return base || 'user';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, company, role, username: providedUsername } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate unique username
    let username = providedUsername?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!username) {
      username = generateUsername(name);
    }

    // Ensure uniqueness
    let usernameExists = await db.user.findUnique({ where: { username } });
    let suffix = Math.floor(Math.random() * 9000) + 1000;
    const baseUsername = username;
    while (usernameExists) {
      username = `${baseUsername}${suffix}`;
      usernameExists = await db.user.findUnique({ where: { username } });
      suffix = Math.floor(Math.random() * 9000) + 1000;
    }

    const hashedPassword = hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
        phone: phone || null,
        company: company || null,
        role: role || 'student',
      },
    });

    const token = createSessionToken(user.id);

    const response = NextResponse.json({
      message: 'Account created successfully',
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

    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const secure = proto === 'https';

    response.cookies.set('xfoundry_session', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('xfoundry_user_id', user.id, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
