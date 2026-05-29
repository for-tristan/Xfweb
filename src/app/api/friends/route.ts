import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: List friends and pending requests
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get accepted friendships
    const accepted = await db.friendship.findMany({
      where: {
        OR: [
          { senderId: user.id, status: 'accepted' },
          { receiverId: user.id, status: 'accepted' },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, username: true, avatar: true } },
        receiver: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const friends = accepted.map((f) => {
      const isSender = f.senderId === user.id;
      const friend = isSender ? f.receiver : f.sender;
      return {
        id: f.id,
        friendId: friend.id,
        name: friend.name,
        username: friend.username,
        avatar: friend.avatar,
        createdAt: f.createdAt,
      };
    });

    // Get pending friend requests (sent to me)
    const pendingReceived = await db.friendship.findMany({
      where: {
        receiverId: user.id,
        status: 'pending',
      },
      include: {
        sender: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingRequests = pendingReceived.map((f) => ({
      id: f.id,
      friendId: f.sender.id,
      name: f.sender.name,
      username: f.sender.username,
      avatar: f.sender.avatar,
      createdAt: f.createdAt,
    }));

    // Get sent friend requests
    const pendingSent = await db.friendship.findMany({
      where: {
        senderId: user.id,
        status: 'pending',
      },
      include: {
        receiver: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sentRequests = pendingSent.map((f) => ({
      id: f.id,
      friendId: f.receiver.id,
      name: f.receiver.name,
      username: f.receiver.username,
      avatar: f.receiver.avatar,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({ friends, pendingRequests, sentRequests });
  } catch (error) {
    console.error('Friends list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send friend request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { friendUsername } = body;

    if (!friendUsername) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const friendUser = await db.user.findUnique({
      where: { username: friendUsername.toLowerCase().trim() },
      select: { id: true, name: true },
    });

    if (!friendUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (friendUser.id === user.id) {
      return NextResponse.json({ error: 'You cannot add yourself as a friend' }, { status: 400 });
    }

    // Check if friendship already exists
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendUser.id },
          { senderId: friendUser.id, receiverId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'You are already friends' }, { status: 409 });
      }
      if (existing.status === 'pending') {
        if (existing.senderId === user.id) {
          return NextResponse.json({ error: 'Friend request already sent' }, { status: 409 });
        }
        return NextResponse.json({ error: 'They already sent you a friend request' }, { status: 409 });
      }
    }

    const friendship = await db.friendship.create({
      data: {
        senderId: user.id,
        receiverId: friendUser.id,
        status: 'pending',
      },
      include: {
        receiver: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    return NextResponse.json({
      message: `Friend request sent to ${friendUser.name}`,
      friendship: {
        id: friendship.id,
        friendId: friendship.receiver.id,
        name: friendship.receiver.name,
        username: friendship.receiver.username,
        avatar: friendship.receiver.avatar,
        createdAt: friendship.createdAt,
      },
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Accept/reject friend request
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { friendshipId, action } = body;

    if (!friendshipId || !action) {
      return NextResponse.json({ error: 'Friendship ID and action are required' }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be accept or reject' }, { status: 400 });
    }

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    if (friendship.receiverId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json({ error: 'This request has already been handled' }, { status: 400 });
    }

    if (action === 'accept') {
      await db.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' },
      });
      return NextResponse.json({ message: 'Friend request accepted' });
    } else {
      await db.friendship.delete({
        where: { id: friendshipId },
      });
      return NextResponse.json({ message: 'Friend request rejected' });
    }
  } catch (error) {
    console.error('Handle friend request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove friend
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendshipId = searchParams.get('friendshipId');

    if (!friendshipId) {
      return NextResponse.json({ error: 'Friendship ID is required' }, { status: 400 });
    }

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    if (friendship.senderId !== user.id && friendship.receiverId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await db.friendship.delete({
      where: { id: friendshipId },
    });

    return NextResponse.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
