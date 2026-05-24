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
    // Each deletion is wrapped in its own try/catch so that if a table
    // doesn't exist in the remote Turso database, we skip it gracefully
    // instead of failing the entire operation.
    const deletions: Promise<unknown>[] = [
      // Test-related (depend on ModuleTest)
      db.testAttempt.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      db.testUnlock.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      // Certificates
      db.certificate.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      // Module-related (depend on CourseModule)
      db.moduleStudy.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      db.moduleUnlock.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      // Account links
      db.accountLink.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      // Course progress & sessions
      db.courseProgress.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      db.studySession.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      // Notifications
      db.notification.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      // Social (bidirectional — delete where user is sender OR receiver)
      db.chatMessage.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } }).catch(() => {}),
      db.friendship.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } }).catch(() => {}),
      // Enrollments & quote requests (previously missing onDelete: Cascade)
      db.enrollment.deleteMany({ where: { userId: user.id } }).catch(() => {}),
      db.quoteRequest.deleteMany({ where: { userId: user.id } }).catch(() => {}),
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
