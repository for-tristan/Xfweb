import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, deleteAllUserSessions } from '@/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null };
  }
  if (user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user: admin } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    if (!['student', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be "student" or "admin"' },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if this would remove the last admin
    if (targetUser.role === 'admin' && role === 'student') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin' },
          { status: 400 }
        );
      }
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    // SECURITY: Invalidate all sessions for this user after role change
    // so they need to re-login with their new permissions
    await deleteAllUserSessions(userId);

    return NextResponse.json({
      message: `User role updated to ${role}`,
      user: updated,
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user: admin } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if this would delete the last admin
    if (targetUser.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin' },
          { status: 400 }
        );
      }
    }

    // SECURITY: Delete related records in a transaction to prevent partial deletes
    await db.$transaction([
      db.certificate.deleteMany({ where: { userId } }),
      db.moduleStudy.deleteMany({ where: { userId } }),
      db.moduleUnlock.deleteMany({ where: { userId } }),
      db.chatMessage.deleteMany({ where: { senderId: userId } }),
      db.chatMessage.deleteMany({ where: { receiverId: userId } }),
      db.friendship.deleteMany({ where: { senderId: userId } }),
      db.friendship.deleteMany({ where: { receiverId: userId } }),
      db.studySession.deleteMany({ where: { userId } }),
      db.courseProgress.deleteMany({ where: { userId } }),
      db.notification.deleteMany({ where: { userId } }),
      db.quoteRequest.deleteMany({ where: { userId } }),
      db.enrollment.deleteMany({ where: { userId } }),
      db.accountLink.deleteMany({ where: { userId } }),
      db.session.deleteMany({ where: { userId } }),
      db.testAttempt.deleteMany({ where: { userId } }),
      db.testUnlock.deleteMany({ where: { userId } }),
      db.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
