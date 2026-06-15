import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireInstructorOrAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const whereClause: Record<string, unknown> = {};
    if (isInstructor && user) {
      whereClause.instructorId = user.id;
    }

    const courses = await db.course.findMany({
      where: whereClause,
      include: {
        modules: {
          orderBy: { moduleOrder: 'asc' },
        },
        instructor: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Get enrollment counts per course (enrollment.courseId = course slug)
    const courseSlugs = courses.map(c => c.slug);

    const enrollmentCounts = await db.enrollment.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseSlugs },
        deletedAt: null,
      },
      _count: { id: true },
    });

    const enrollmentMap = new Map(enrollmentCounts.map(e => [e.courseId, e._count.id]));

    const parsed = courses.map(c => ({
      ...c,
      features: JSON.parse(c.features || '[]'),
      moduleCount: c.modules.length,
      enrollmentCount: enrollmentMap.get(c.slug) || 0,
    }));

    return NextResponse.json({ courses: parsed });
  } catch (error) {
    console.error('Instructor courses fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const {
      title, slug, description, level, duration, price, icon,
      features, prerequisites, techStack, instructorId,
    } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
    }

    // Instructors always get their own ID; admins can optionally specify
    const assignedInstructorId = isInstructor ? user!.id : (instructorId || null);

    const course = await db.course.create({
      data: {
        title,
        slug,
        description: description || '',
        level: level || 'Beginner',
        duration: duration || '4 Weeks',
        price: price || 'Free',
        icon: icon || 'fa-solid fa-graduation-cap',
        features: features ? JSON.stringify(features) : '[]',
        prerequisites: prerequisites || '',
        techStack: techStack || '',
        instructorId: assignedInstructorId,
      },
      include: {
        instructor: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Instructor course create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const {
      id, title, slug, description, level, duration, price, icon,
      status, features, prerequisites, techStack, displayOrder, instructorId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Instructors can only update their own courses
    if (isInstructor && existing.instructorId !== user!.id) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own courses' }, { status: 403 });
    }

    // Only admins can reassign instructor
    const updateData: Record<string, unknown> = {
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
    };

    if (isAdmin && instructorId !== undefined) {
      updateData.instructorId = instructorId;
    }

    const course = await db.course.update({
      where: { id },
      data: updateData,
      include: {
        instructor: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Instructor course update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Instructors can only delete their own courses
    if (isInstructor && existing.instructorId !== user!.id) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own courses' }, { status: 403 });
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
    const moduleIds = (await db.courseModule.findMany({
      where: { courseId: id },
      select: { id: true },
    })).map(m => m.id);

    if (moduleIds.length > 0) {
      // Clean up module unlocks
      await db.moduleUnlock.deleteMany({ where: { moduleId: { in: moduleIds } } });
      // Clean up module studies
      await db.moduleStudy.deleteMany({ where: { moduleId: { in: moduleIds } } });
      // Clean up tests (cascade should handle questions/attempts/unlocks, but be explicit)
      const testIds = (await db.moduleTest.findMany({
        where: { moduleId: { in: moduleIds } },
        select: { id: true },
      })).map(t => t.id);
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
    console.error('Instructor course delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
