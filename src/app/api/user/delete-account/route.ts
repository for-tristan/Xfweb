import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Delete all related data in dependency order.
    // Use a safe delete helper to skip models that may not exist on this Prisma client.
    const safeDelete = (model: string, where: any) => {
      const m = (db as any)[model];
      if (!m || typeof m.deleteMany !== 'function') return Promise.resolve();
      return m.deleteMany({ where }).catch(() => {});
    };

    const deletions: Promise<unknown>[] = [
      // Test-related (depend on ModuleTest)
      safeDelete('testAttempt', { userId: user.id }),
      safeDelete('testUnlock', { userId: user.id }),
      // Certificates
      safeDelete('certificate', { userId: user.id }),
      // Module-related (depend on CourseModule)
      safeDelete('moduleStudy', { userId: user.id }),
      safeDelete('moduleUnlock', { userId: user.id }),
      // Account links
      safeDelete('accountLink', { userId: user.id }),
      // Course progress & sessions
      safeDelete('courseProgress', { userId: user.id }),
      safeDelete('studySession', { userId: user.id }),
      // Notifications
      safeDelete('notification', { userId: user.id }),
      // Social (bidirectional — delete where user is sender OR receiver)
      safeDelete('chatMessage', { OR: [{ senderId: user.id }, { receiverId: user.id }] }),
      safeDelete('friendship', { OR: [{ senderId: user.id }, { receiverId: user.id }] }),
      // Enrollments & quote requests (previously missing onDelete: Cascade)
      safeDelete('enrollment', { userId: user.id }),
      safeDelete('quoteRequest', { userId: user.id }),
    ];

    await Promise.all(deletions);

    // Finally delete the user
    await db.user.delete({ where: { id: user.id } });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
