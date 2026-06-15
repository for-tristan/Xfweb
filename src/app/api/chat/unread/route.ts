import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const unreadMessages = await db.chatMessage.findMany({
      where: {
        receiverId: user.id,
        read: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const senderMap = new Map<string, {
      userId: string;
      name: string;
      username: string | null;
      avatar: string | null;
      unreadCount: number;
      lastMessageAt: Date;
    }>();

    for (const msg of unreadMessages) {
      const existing = senderMap.get(msg.senderId);
      if (existing) {
        existing.unreadCount += 1;
      } else {
        senderMap.set(msg.senderId, {
          userId: msg.sender.id,
          name: msg.sender.name,
          username: msg.sender.username,
          avatar: msg.sender.avatar,
          unreadCount: 1,
          lastMessageAt: msg.createdAt,
        });
      }
    }

    const conversations = Array.from(senderMap.values());
    const totalUnread = unreadMessages.length;

    return NextResponse.json({ conversations, totalUnread });
  } catch (error) {
    console.error('Unread messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
