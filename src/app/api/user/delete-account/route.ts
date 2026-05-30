import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, verifyPassword, deleteAllUserSessions } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // SECURITY: Require password confirmation for account deletion
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password confirmation is required to delete your account' },
        { status: 400 }
      );
    }

    // Verify password
    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser || !verifyPassword(password, fullUser.password)) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Delete user and all related data (cascade should handle most)
    await db.user.delete({ where: { id: user.id } });

    // Invalidate all sessions
    await deleteAllUserSessions(user.id);

    const response = NextResponse.json({ message: 'Account deleted successfully' });

    // Clear cookies
    response.cookies.set('xfoundry_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    response.cookies.set('xfoundry_user_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
