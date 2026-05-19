import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: Get unread message count per conversation
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all unread messages grouped by sender
    const unreadMessages = await db.chatMessage.groupBy({
      by: ['senderId'],
      where: {
        receiverId: user.id,
        read: false,
      },
      _count: { id: true },
      _max: { createdAt: true },
    });

    // Get sender details for each conversation
    const conversations = [];
    for (const item of unreadMessages) {
      const sender = await db.user.findUnique({
        where: { id: item.senderId },
        select: { id: true, name: true, username: true, avatar: true },
      });
      if (sender) {
        conversations.push({
          userId: sender.id,
          name: sender.name,
          username: sender.username,
          avatar: sender.avatar,
          unreadCount: item._count.id,
          lastMessageAt: item._max.createdAt,
        });
      }
    }

    const totalUnread = unreadMessages.reduce((sum, item) => sum + item._count.id, 0);

    return NextResponse.json({ conversations, totalUnread });
  } catch (error) {
    console.error('Unread messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
