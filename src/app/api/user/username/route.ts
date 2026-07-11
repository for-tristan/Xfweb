import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username query parameter is required' },
        { status: 400 }
      );
    }

    const normalized = username.toLowerCase().trim();

    if (normalized.length < 3 || normalized.length > 20) {
      return NextResponse.json({ available: false, error: 'Username must be 3-20 characters' });
    }

    if (!/^[a-z0-9_]+$/.test(normalized)) {
      return NextResponse.json({ available: false, error: 'Only letters, numbers, and underscores allowed' });
    }

    const existing = await db.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const normalized = username.toLowerCase().trim();

    if (normalized.length < 3 || normalized.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_]+$/.test(normalized)) {
      return NextResponse.json(
        { error: 'Only lowercase letters, numbers, and underscores allowed' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({
      where: { username: normalized },
    });

    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: 'This username is already taken' }, { status: 409 });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { username: normalized },
      select: { id: true, name: true, email: true, username: true, role: true, phone: true, company: true, avatar: true },
    });

    await logRequest(request, 'USERNAME_CHANGE', {
      userId: user.id,
      email: user.email,
      details: `Changed username from "${user.username}" to "${normalized}"`,
      status: 200,
    });

    return NextResponse.json({ message: 'Username updated', user: updatedUser });
  } catch (error) {
    console.error('Username update error:', error);
    await logRequest(request, 'USERNAME_CHANGE_FAILED', {
      details: `Server error changing username (attempted: ${username ?? 'unknown'}): ${(error as Error).message}`,
      status: 500,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
