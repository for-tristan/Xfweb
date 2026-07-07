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
    const courseIdParam = searchParams.get('courseId');

    if (!courseIdParam) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const course = await db.course.findUnique({
      where: { slug: courseIdParam },
    });
    const realCourseId = course ? course.id : courseIdParam;

    const modules = await db.courseModule.findMany({
      where: { courseId: realCourseId },
      orderBy: { moduleOrder: 'asc' },
    });

    const unlocks = await db.moduleUnlock.findMany({
      where: { userId: user.id },
      select: { moduleId: true },
    });

    const unlockedModuleIds = new Set(unlocks.map(u => u.moduleId));

    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: courseIdParam,
        status: 'approved',
        deletedAt: null,
      },
    });

    const modulesWithStatus = modules.map(m => ({
      id: m.id,
      courseId: m.courseId,
      title: m.title,
      description: m.description,
      // SECURITY: Only return module content if the user is enrolled
      // (approved) AND has unlocked this specific module. Previously
      // the full content was returned for all modules regardless of
      // enrollment or unlock status — leaking premium material to any
      // authenticated user, even newcomers with zero enrollments.
      content: (enrollment && unlockedModuleIds.has(m.id)) ? m.content : '',
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
