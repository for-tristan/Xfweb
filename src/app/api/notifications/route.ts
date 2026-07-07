import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { title, message, type, userId: targetUserId } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // SECURITY: Whitelist notification types. Previously `type` was taken
    // verbatim from the body — a user could forge 'admin' or 'success'
    // types for phishing-style UI spoofing (e.g. fake "Admin Alert:
    // Re-enter your password at https://attacker.example.com").
    const ALLOWED_TYPES = ['info', 'success', 'warning', 'error', 'friend_request', 'friend_accept', 'friend_reject'];
    const safeType = type && ALLOWED_TYPES.includes(type) ? type : 'info';

    // SECURITY: Cap title/message length to prevent abuse.
    const safeTitle = String(title).substring(0, 200);
    const safeMessage = String(message).substring(0, 1000);

    let notificationUserId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Only admins can send notifications to other users' }, { status: 403 });
      }
      const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }
      notificationUserId = targetUserId;
    }

    const notification = await db.notification.create({
      data: {
        userId: notificationUserId,
        title: safeTitle,
        message: safeMessage,
        type: safeType,
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Notification create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();

    if (body.readAll) {
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (body.notificationId) {
      await db.notification.update({
        where: { id: body.notificationId, userId: user.id },
        data: { read: true },
      });
      return NextResponse.json({ message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
