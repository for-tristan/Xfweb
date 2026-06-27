import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, moduleId } = body;

    if (moduleId && !userId) {
      await db.moduleStudy.deleteMany({ where: { moduleId } });
      await db.moduleUnlock.deleteMany({ where: { moduleId } });
      await db.courseModule.delete({ where: { id: moduleId } });
      return NextResponse.json({ message: 'Module deleted' });
    }

    if (!userId || !moduleId) {
      return NextResponse.json(
        { error: 'moduleId is required' },
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

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { courseId, title, description, content, moduleOrder } = body;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'courseId and title are required' },
        { status: 400 }
      );
    }

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const module = await db.courseModule.create({
      data: {
        courseId,
        title,
        description: description || '',
        content: content || '',
        moduleOrder: moduleOrder !== undefined ? moduleOrder : 0,
      },
    });

    return NextResponse.json({ module }, { status: 201 });
  } catch (error) {
    console.error('Admin module create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error: adminError, user: adminUser } = await requireAdmin();
    if (adminError) return adminError;

    const body = await request.json();

    if (body.userId && body.moduleId) {
      const existing = await db.moduleUnlock.findUnique({
        where: { userId_moduleId: { userId: body.userId, moduleId: body.moduleId } },
      });
      if (existing) {
        return NextResponse.json({ message: 'Already unlocked' });
      }
      await db.moduleUnlock.create({
        data: { userId: body.userId, moduleId: body.moduleId, unlockedBy: adminUser!.id },
      });
      const mod = await db.courseModule.findUnique({ where: { id: body.moduleId } });
      if (mod) {
        await db.notification.create({
          data: { userId: body.userId, title: 'Module Unlocked', message: `"${mod.title}" has been unlocked by an admin.`, type: 'success' },
        });
      }
      return NextResponse.json({ message: 'Module unlocked' });
    }

    if (body.userId && body.courseId && body.unlockAll) {
      const courseModules = await db.courseModule.findMany({ where: { courseId: body.courseId } });
      let created = 0;
      for (const m of courseModules) {
        const exists = await db.moduleUnlock.findUnique({
          where: { userId_moduleId: { userId: body.userId, moduleId: m.id } },
        });
        if (!exists) {
          await db.moduleUnlock.create({
            data: { userId: body.userId, moduleId: m.id, unlockedBy: adminUser!.id },
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
    const module = await db.courseModule.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(moduleOrder !== undefined && { moduleOrder }),
      },
    });
    return NextResponse.json({ module });
  } catch (error) {
    console.error('Admin module update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
