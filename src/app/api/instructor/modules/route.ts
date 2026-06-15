import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireInstructorOrAdmin } from '@/lib/auth';

/**
 * Helper: get course IDs that belong to the instructor (or all for admin).
 * Returns an array of course CUIDs.
 */
async function getInstructorCourseIds(instructorId: string | undefined, isAdmin: boolean): Promise<string[]> {
  if (isAdmin || !instructorId) {
    const all = await db.course.findMany({ select: { id: true } });
    return all.map(c => c.id);
  }
  const mine = await db.course.findMany({
    where: { instructorId },
    select: { id: true },
  });
  return mine.map(c => c.id);
}

export async function GET(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Get the set of course IDs this instructor can access
    const allowedCourseIds = await getInstructorCourseIds(user?.id, isAdmin);

    // If a specific courseId is requested, verify access
    if (courseId && !allowedCourseIds.includes(courseId)) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this course' }, { status: 403 });
    }

    const whereClause: Record<string, unknown> = {};
    if (courseId) {
      whereClause.courseId = courseId;
    } else {
      // Only show modules for courses the instructor can access
      whereClause.courseId = { in: allowedCourseIds };
    }

    const modules = await db.courseModule.findMany({
      where: whereClause,
      orderBy: { moduleOrder: 'asc' },
      include: {
        _count: { select: { tests: true } },
      },
    });

    // Get all unlocks grouped by moduleId (only for allowed courses)
    const unlocks = await db.moduleUnlock.findMany({
      where: { moduleId: { in: modules.map(m => m.id) } },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const unlockMap: Record<string, typeof unlocks> = {};
    for (const u of unlocks) {
      if (!unlockMap[u.moduleId]) unlockMap[u.moduleId] = [];
      unlockMap[u.moduleId].push(u);
    }

    const modulesWithExtras = modules.map(m => ({
      ...m,
      testCount: m._count.tests,
      unlocks: unlockMap[m.id] || [],
    }));

    return NextResponse.json({ modules: modulesWithExtras });
  } catch (error) {
    console.error('Instructor modules fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const { courseId, title, description, content, moduleOrder } = body;

    if (!courseId || !title) {
      return NextResponse.json({ error: 'courseId and title are required' }, { status: 400 });
    }

    // Verify course exists
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Instructors can only add modules to their own courses
    if (isInstructor && course.instructorId !== user!.id) {
      return NextResponse.json({ error: 'Forbidden: You can only add modules to your own courses' }, { status: 403 });
    }

    const module_ = await db.courseModule.create({
      data: {
        courseId,
        title,
        description: description || '',
        content: content || '',
        moduleOrder: moduleOrder !== undefined ? moduleOrder : 0,
      },
    });

    return NextResponse.json({ module: module_ }, { status: 201 });
  } catch (error) {
    console.error('Instructor module create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();

    if (body.userId && body.moduleId && !body.unlockAll) {
      const { userId, moduleId } = body;

      // Verify the module belongs to an instructor-accessible course
      const mod = await db.courseModule.findUnique({ where: { id: moduleId } });
      if (!mod) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
      }

      if (isInstructor) {
        const course = await db.course.findUnique({ where: { id: mod.courseId } });
        if (!course || course.instructorId !== user!.id) {
          return NextResponse.json({ error: 'Forbidden: You can only manage modules in your own courses' }, { status: 403 });
        }
      }

      const existing = await db.moduleUnlock.findUnique({
        where: { userId_moduleId: { userId, moduleId } },
      });
      if (existing) {
        return NextResponse.json({ message: 'Already unlocked' });
      }

      await db.moduleUnlock.create({
        data: { userId, moduleId, unlockedBy: user!.id },
      });

      await db.notification.create({
        data: {
          userId,
          title: 'Module Unlocked',
          message: `"${mod.title}" has been unlocked by your instructor.`,
          type: 'success',
        },
      });

      return NextResponse.json({ message: 'Module unlocked' });
    }

    if (body.userId && body.courseId && body.unlockAll) {
      const { userId, courseId } = body;

      // Verify course access
      const course = await db.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      if (isInstructor && course.instructorId !== user!.id) {
        return NextResponse.json({ error: 'Forbidden: You can only manage modules in your own courses' }, { status: 403 });
      }

      const courseModules = await db.courseModule.findMany({ where: { courseId } });
      let created = 0;
      for (const m of courseModules) {
        const exists = await db.moduleUnlock.findUnique({
          where: { userId_moduleId: { userId, moduleId: m.id } },
        });
        if (!exists) {
          await db.moduleUnlock.create({
            data: { userId, moduleId: m.id, unlockedBy: user!.id },
          });
          created++;
        }
      }
      return NextResponse.json({ created });
    }

    const { id, title, description, content, moduleOrder } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.courseModule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Instructors can only update modules in their own courses
    if (isInstructor) {
      const course = await db.course.findUnique({ where: { id: existing.courseId } });
      if (!course || course.instructorId !== user!.id) {
        return NextResponse.json({ error: 'Forbidden: You can only update modules in your own courses' }, { status: 403 });
      }
    }

    const module_ = await db.courseModule.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(moduleOrder !== undefined && { moduleOrder }),
      },
    });

    return NextResponse.json({ module: module_ });
  } catch (error) {
    console.error('Instructor module update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const { moduleId, userId } = body;

    if (moduleId && userId) {
      const mod = await db.courseModule.findUnique({ where: { id: moduleId } });
      if (!mod) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
      }

      // Instructors can only lock modules in their own courses
      if (isInstructor) {
        const course = await db.course.findUnique({ where: { id: mod.courseId } });
        if (!course || course.instructorId !== user!.id) {
          return NextResponse.json({ error: 'Forbidden: You can only manage modules in your own courses' }, { status: 403 });
        }
      }

      const result = await db.moduleUnlock.deleteMany({
        where: { userId, moduleId },
      });

      if (result.count === 0) {
        return NextResponse.json({ error: 'Module was not unlocked for this user' }, { status: 404 });
      }

      await db.notification.create({
        data: {
          userId,
          title: 'Module Locked',
          message: `"${mod.title}" has been locked by your instructor.`,
          type: 'warning',
        },
      });

      return NextResponse.json({ message: 'Module locked successfully', deleted: result.count });
    }

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
    }

    const mod = await db.courseModule.findUnique({ where: { id: moduleId } });
    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Instructors can only delete modules in their own courses
    if (isInstructor) {
      const course = await db.course.findUnique({ where: { id: mod.courseId } });
      if (!course || course.instructorId !== user!.id) {
        return NextResponse.json({ error: 'Forbidden: You can only delete modules in your own courses' }, { status: 403 });
      }
    }

    // Clean up related data before deleting
    await db.moduleStudy.deleteMany({ where: { moduleId } });
    await db.moduleUnlock.deleteMany({ where: { moduleId } });

    // Clean up tests within this module
    const testIds = (await db.moduleTest.findMany({
      where: { moduleId },
      select: { id: true },
    })).map(t => t.id);
    if (testIds.length > 0) {
      await db.testAttempt.deleteMany({ where: { testId: { in: testIds } } });
      await db.testUnlock.deleteMany({ where: { testId: { in: testIds } } });
      await db.testQuestion.deleteMany({ where: { testId: { in: testIds } } });
      await db.moduleTest.deleteMany({ where: { id: { in: testIds } } });
    }

    await db.courseModule.delete({ where: { id: moduleId } });

    return NextResponse.json({ message: 'Module deleted' });
  } catch (error) {
    console.error('Instructor module delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
