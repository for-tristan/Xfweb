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

// Course total modules mapping
const COURSE_TOTAL_MODULES: Record<string, number> = {
  'ml-bootcamp': 8,
  'linux-basics': 6,
};

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const includeStudy = searchParams.get('includeStudy') === 'true';
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    // If includeStudy with userId+courseId, return module-level study data
    if (includeStudy && userId && courseId) {
      const modules = await db.courseModule.findMany({
        where: { courseId },
        orderBy: { moduleOrder: 'asc' },
      });

      const studies = await db.moduleStudy.findMany({
        where: { userId },
        orderBy: { moduleOrder: 'asc' },
      });

      const studyMap = new Map(studies.map(s => [s.moduleId, s]));

      const moduleStudies = modules.map(m => {
        const study = studyMap.get(m.id);
        return {
          moduleId: m.id,
          moduleTitle: m.title,
          moduleOrder: m.moduleOrder,
          timeSpent: study?.timeSpent || 0,
          studied: study?.studied || false,
          lastStudied: study?.lastStudied?.toISOString() || '',
        };
      });

      return NextResponse.json({ moduleStudies });
    }

    const progressRecords = await db.courseProgress.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: { lastAccessed: 'desc' },
    });

    const progress = progressRecords.map((record) => {
      const completedModules: number[] = JSON.parse(record.completedModules || '[]');
      const totalModules = COURSE_TOTAL_MODULES[record.courseId] || 8;
      const completionPercentage = totalModules > 0
        ? Math.round((completedModules.length / totalModules) * 100)
        : 0;

      return {
        id: record.id,
        userId: record.userId,
        courseId: record.courseId,
        courseName: record.courseName,
        completedModules: completedModules,
        totalModules,
        completionPercentage,
        lastAccessed: record.lastAccessed,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        user: record.user,
      };
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Admin progress fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, courseId, courseName, completedModules } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(completedModules)) {
      return NextResponse.json(
        { error: 'completedModules must be an array of module numbers' },
        { status: 400 }
      );
    }

    // Upsert CourseProgress
    const progress = await db.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        courseName: courseName || courseId,
        completedModules: JSON.stringify(completedModules),
        lastAccessed: new Date(),
      },
      update: {
        completedModules: JSON.stringify(completedModules),
        lastAccessed: new Date(),
      },
    });

    const totalModules = COURSE_TOTAL_MODULES[courseId] || 8;
    const completionPercentage = totalModules > 0
      ? Math.round((completedModules.length / totalModules) * 100)
      : 0;

    return NextResponse.json({
      message: 'Progress updated successfully',
      progress: {
        ...progress,
        completedModules,
        totalModules,
        completionPercentage,
      },
    });
  } catch (error) {
    console.error('Admin progress update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'userId and courseId are required' }, { status: 400 });
    }

    // Reset progress to empty
    const progress = await db.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        courseName: courseId,
        completedModules: '[]',
        lastAccessed: new Date(),
      },
      update: {
        completedModules: '[]',
        lastAccessed: new Date(),
      },
    });

    return NextResponse.json({ message: 'Progress reset successfully', progress });
  } catch (error) {
    console.error('Admin progress reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
