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

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const courses = await db.course.findMany({
      include: {
        modules: {
          orderBy: { moduleOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Parse JSON string fields to proper types
    const parsed = courses.map(c => ({
      ...c,
      features: JSON.parse(c.features || '[]'),
      moduleCount: c.modules.length,
    }));

    return NextResponse.json({ courses: parsed });
  } catch (error) {
    console.error('Admin courses fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { title, slug, description, level, duration, price, icon, features, prerequisites, techStack } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'title and slug are required' },
        { status: 400 }
      );
    }

    const course = await db.course.create({
      data: {
        title,
        slug,
        description: description || '',
        level: level || 'Beginner',
        duration: duration || '4 Weeks',
        price: price || 'Free',
        icon: icon || 'fas fa-graduation-cap',
        features: features ? JSON.stringify(features) : '[]',
        prerequisites: prerequisites || '',
        techStack: techStack || '',
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Admin course create error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id, title, slug, description, level, duration, price, icon, status, features, prerequisites, techStack, displayOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = await db.course.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level }),
        ...(duration !== undefined && { duration }),
        ...(price !== undefined && { price }),
        ...(icon !== undefined && { icon }),
        ...(status !== undefined && { status }),
        ...(features !== undefined && { features: JSON.stringify(features) }),
        ...(prerequisites !== undefined && { prerequisites }),
        ...(techStack !== undefined && { techStack }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Admin course update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const slug = existing.slug;

    // Clean up all related data before deleting the course
    // Enrollment stores courseId as the slug (not a FK), so manual cleanup needed
    await db.enrollment.deleteMany({ where: { courseId: slug } });
    // CourseProgress also stores courseId as slug
    await db.courseProgress.deleteMany({ where: { courseId: slug } });
    // StudySession also stores courseId as slug
    await db.studySession.deleteMany({ where: { courseId: slug } });
    // Certificate also stores courseId as slug
    await db.certificate.deleteMany({ where: { courseId: slug } });

    // CourseModule has onDelete: Cascade, but also clean up module-related data explicitly
    const moduleIds = (await db.courseModule.findMany({ where: { courseId: id }, select: { id: true } })).map(m => m.id);
    if (moduleIds.length > 0) {
      // Clean up module unlocks
      await db.moduleUnlock.deleteMany({ where: { moduleId: { in: moduleIds } } });
      // Clean up module studies
      await db.moduleStudy.deleteMany({ where: { moduleId: { in: moduleIds } } });
      // Clean up tests (cascade should handle questions/attempts/unlocks, but be explicit)
      const testIds = (await db.moduleTest.findMany({ where: { moduleId: { in: moduleIds } }, select: { id: true } })).map(t => t.id);
      if (testIds.length > 0) {
        await db.testAttempt.deleteMany({ where: { testId: { in: testIds } } });
        await db.testUnlock.deleteMany({ where: { testId: { in: testIds } } });
        await db.testQuestion.deleteMany({ where: { testId: { in: testIds } } });
        await db.moduleTest.deleteMany({ where: { id: { in: testIds } } });
      }
    }

    await db.course.delete({ where: { id } });

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Admin course delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
