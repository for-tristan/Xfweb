import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null };
  }
  if (user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, moduleId } = body;

    if (!userId || !moduleId) {
      return NextResponse.json(
        { error: 'userId and moduleId are required' },
        { status: 400 }
      );
    }

    const result = await db.moduleUnlock.deleteMany({
      where: { userId, moduleId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Module was not unlocked for this user' },
        { status: 404 }
      );
    }

    // Notify user
    const courseModule = await db.courseModule.findUnique({ where: { id: moduleId } });
    if (courseModule) {
      await db.notification.create({
        data: {
          userId,
          title: 'Module Locked',
          message: `"${courseModule.title}" has been locked by an admin.`,
          type: 'warning',
        },
      });
    }

    return NextResponse.json({ message: 'Module locked successfully', deleted: result.count });
  } catch (error) {
    console.error('Admin module lock error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const whereClause: Record<string, unknown> = {};
    if (courseId) {
      whereClause.courseId = courseId;
    }

    const modules = await db.courseModule.findMany({
      where: whereClause,
      orderBy: { moduleOrder: 'asc' },
    });

    // Get all unlocks grouped by moduleId
    const unlocks = await db.moduleUnlock.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build a map: moduleId -> array of unlocks with user info
    const unlockMap: Record<string, typeof unlocks> = {};
    for (const u of unlocks) {
      if (!unlockMap[u.moduleId]) unlockMap[u.moduleId] = [];
      unlockMap[u.moduleId].push(u);
    }

    const modulesWithUnlocks = modules.map(m => ({
      ...m,
      unlocks: unlockMap[m.id] || [],
    }));

    return NextResponse.json({ modules: modulesWithUnlocks });
  } catch (error) {
    console.error('Admin modules fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user: admin } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, moduleId, unlockAll } = body;

    if (unlockAll) {
      // Bulk unlock: unlock all modules for a user in a given course
      const { courseId } = body;
      if (!userId || !courseId) {
        return NextResponse.json(
          { error: 'userId and courseId are required for bulk unlock' },
          { status: 400 }
        );
      }

      const modules = await db.courseModule.findMany({
        where: { courseId },
      });

      let created = 0;
      for (const mod of modules) {
        const existing = await db.moduleUnlock.findUnique({
          where: { userId_moduleId: { userId, moduleId: mod.id } },
        });
        if (!existing) {
          await db.moduleUnlock.create({
            data: { userId, moduleId: mod.id, unlockedBy: admin!.id },
          });
          created++;
        }
      }

      // Notify user
      await db.notification.create({
        data: {
          userId,
          title: 'All Modules Unlocked',
          message: `All modules have been unlocked for your course. Congratulations!`,
          type: 'success',
        },
      });

      return NextResponse.json({ message: `${created} modules unlocked`, created });
    }

    if (!userId || !moduleId) {
      return NextResponse.json(
        { error: 'userId and moduleId are required' },
        { status: 400 }
      );
    }

    // Check if module exists
    const courseModule = await db.courseModule.findUnique({ where: { id: moduleId } });
    if (!courseModule) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    // Check if already unlocked
    const existing = await db.moduleUnlock.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Module already unlocked for this user' },
        { status: 409 }
      );
    }

    // Create unlock
    const unlock = await db.moduleUnlock.create({
      data: { userId, moduleId, unlockedBy: admin!.id },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId,
        title: 'New Module Unlocked',
        message: `"${courseModule.title}" has been unlocked. Head to the course page to start learning!`,
        type: 'success',
      },
    });

    return NextResponse.json({ message: 'Module unlocked successfully', unlock });
  } catch (error) {
    console.error('Admin module unlock error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
