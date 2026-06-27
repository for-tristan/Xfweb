import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deleteAllUserSessions, requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    // Pagination: ?page=1&limit=50. If neither param is supplied, return the
    // full list (preserves the existing admin UI behaviour). When either is
    // supplied, both default sensibly and the response includes `total` /
    // `totalPages` for the client to render pagination controls.
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const paginating = pageParam !== null || limitParam !== null;

    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(limitParam || '50', 10) || 50));
    const search = url.searchParams.get('search')?.trim() || '';
    const role = url.searchParams.get('role')?.trim() || '';

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { username: { contains: search } },
        ],
      }),
      ...(role && ['student', 'instructor', 'admin'].includes(role) ? { role: role as 'student' | 'instructor' | 'admin' } : {}),
    };

    const select = {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      avatar: true,
      createdAt: true,
    };

    if (!paginating) {
      // Legacy path: no pagination requested — return the full list as before.
      const users = await db.user.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ users });
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    });
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

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be "student", "instructor", or "admin"' },
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
    if (!admin) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

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

    if (targetUser.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin' },
          { status: 400 }
        );
      }
    }

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
