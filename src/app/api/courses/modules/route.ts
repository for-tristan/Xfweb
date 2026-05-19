import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const modules = await db.courseModule.findMany({
      where: { courseId },
      orderBy: { moduleOrder: 'asc' },
    });

    // Get unlocks for this user
    const unlocks = await db.moduleUnlock.findMany({
      where: { userId: user.id },
      select: { moduleId: true },
    });

    const unlockedModuleIds = new Set(unlocks.map(u => u.moduleId));

    // Check if user has an approved enrollment for this course
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
        status: 'approved',
        deletedAt: null,
      },
    });

    const modulesWithStatus = modules.map(m => ({
      id: m.id,
      courseId: m.courseId,
      title: m.title,
      description: m.description,
      content: m.content,
      moduleOrder: m.moduleOrder,
      unlocked: unlockedModuleIds.has(m.id),
      hasAccess: !!enrollment,
    }));

    const totalModules = modules.length;
    const unlockedCount = modulesWithStatus.filter(m => m.unlocked).length;

    return NextResponse.json({
      modules: modulesWithStatus,
      totalModules,
      unlockedCount,
      hasAccess: !!enrollment,
    });
  } catch (error) {
    console.error('Student modules fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
