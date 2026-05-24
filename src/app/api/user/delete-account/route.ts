import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Delete all related data in dependency order to avoid FK constraint errors
    // Even though the schema has onDelete: Cascade, SQLite with Turso sometimes
    // doesn't enforce it at the application level, so we delete explicitly.
    await db.testAttempt.deleteMany({ where: { userId: user.id } });
    await db.testUnlock.deleteMany({ where: { userId: user.id } });
    await db.certificate.deleteMany({ where: { userId: user.id } });
    await db.moduleStudy.deleteMany({ where: { userId: user.id } });
    await db.moduleUnlock.deleteMany({ where: { userId: user.id } });
    await db.accountLink.deleteMany({ where: { userId: user.id } });
    await db.courseProgress.deleteMany({ where: { userId: user.id } });
    await db.studySession.deleteMany({ where: { userId: user.id } });
    await db.notification.deleteMany({ where: { userId: user.id } });
    await db.chatMessage.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } });
    await db.friendship.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } });
    await db.enrollment.deleteMany({ where: { userId: user.id } });
    await db.quoteRequest.deleteMany({ where: { userId: user.id } });

    // Finally delete the user
    await db.user.delete({ where: { id: user.id } });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
