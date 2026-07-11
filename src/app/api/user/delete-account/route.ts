import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, verifyPassword, deleteAllUserSessions } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password confirmation is required to delete your account' },
        { status: 400 }
      );
    }

    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser || !verifyPassword(password, fullUser.password)) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    await db.user.delete({ where: { id: user.id } });

    await logRequest(request, 'ACCOUNT_DELETE', {
      userId: user.id,
      email: user.email,
      details: `User permanently deleted their account (userId: ${user.id}, email: ${user.email}${user.username ? `, username: ${user.username}` : ''}). All sessions revoked.`,
      status: 200,
    });

    await deleteAllUserSessions(user.id);

    const response = NextResponse.json({ message: 'Account deleted successfully' });

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
    await logRequest(request, 'ACCOUNT_DELETE_FAILED', {
      details: `Server error deleting account: ${(error as Error).message}`,
      status: 500,
    });
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
