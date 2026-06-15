import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireInstructorOrAdmin } from '@/lib/auth';
import { sendEnrollmentStatusEmail } from '@/lib/email';

/**
 * Helper: get course slugs that belong to the instructor.
 * Enrollment.courseId stores the course SLUG (not CUID), so we need slugs for filtering.
 */
async function getInstructorCourseSlugs(instructorId: string): Promise<string[]> {
  const courses = await db.course.findMany({
    where: { instructorId },
    select: { slug: true },
  });
  return courses.map(c => c.slug);
}

/**
 * Helper: verify that an enrollment belongs to a course owned by the instructor.
 * Enrollment.courseId is the course slug; we look up the course by slug to check instructorId.
 */
async function verifyEnrollmentAccess(
  enrollmentCourseSlug: string,
  instructorId: string | undefined,
  isInstructor: boolean,
): Promise<boolean> {
  if (!isInstructor || !instructorId) return true; // admins always pass

  const course = await db.course.findUnique({ where: { slug: enrollmentCourseSlug } });
  if (!course || course.instructorId !== instructorId) return false;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = { deletedAt: null };

    // Instructors only see enrollments for their courses
    if (isInstructor && user) {
      const slugs = await getInstructorCourseSlugs(user.id);
      whereClause.courseId = { in: slugs };
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const enrollments = await db.enrollment.findMany({
      where: whereClause,
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
      orderBy: { enrolledAt: 'desc' },
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Instructor enrollments fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const { enrollmentId, status } = body;

    if (!enrollmentId || !status) {
      return NextResponse.json({ error: 'Enrollment ID and status are required' }, { status: 400 });
    }

    if (!['approved', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Status must be "approved" or "declined"' }, { status: 400 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.deletedAt) {
      return NextResponse.json({ error: 'Cannot update a cancelled enrollment' }, { status: 400 });
    }

    // Instructors can only manage enrollments for their own courses
    if (!(await verifyEnrollmentAccess(enrollment.courseId, user?.id, isInstructor))) {
      return NextResponse.json({ error: 'Forbidden: You can only manage enrollments for your own courses' }, { status: 403 });
    }

    const updated = await db.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
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
    });

    // Create notification for the user
    if (status === 'approved') {
      await db.notification.create({
        data: {
          userId: updated.userId,
          title: 'Enrollment Approved',
          message: `Your enrollment in "${updated.courseName}" has been approved! You can now access the course materials.`,
          type: 'success',
        },
      });

      // Auto-unlock first module
      // enrollment.courseId stores the slug, but courseModule.courseId is the Course CUID
      const course = await db.course.findUnique({
        where: { slug: updated.courseId },
      });
      if (course) {
        const firstModule = await db.courseModule.findFirst({
          where: { courseId: course.id },
          orderBy: { moduleOrder: 'asc' },
        });
        if (firstModule) {
          await db.moduleUnlock.upsert({
            where: { userId_moduleId: { userId: updated.userId, moduleId: firstModule.id } },
            create: { userId: updated.userId, moduleId: firstModule.id, unlockedBy: user!.id },
            update: {},
          });
        }
      }

      // Create CourseProgress record for the student
      await db.courseProgress.upsert({
        where: { userId_courseId: { userId: updated.userId, courseId: updated.courseId } },
        create: {
          userId: updated.userId,
          courseId: updated.courseId,
          courseName: updated.courseName,
          completedModules: '[]',
          lastAccessed: new Date(),
        },
        update: { lastAccessed: new Date() },
      });
    } else if (status === 'declined') {
      await db.notification.create({
        data: {
          userId: updated.userId,
          title: 'Enrollment Declined',
          message: `Your enrollment in "${updated.courseName}" has been declined. You can re-apply or contact us for more information.`,
          type: 'warning',
        },
      });
    }

    // Send email notification
    try {
      await sendEnrollmentStatusEmail({
        userName: updated.user.name,
        userEmail: updated.user.email,
        courseName: updated.courseName,
        status: status as 'approved' | 'declined',
      });
    } catch (emailErr: any) {
      console.error('[Instructor Enrollments] Email send failed:', emailErr?.message || emailErr);
    }

    return NextResponse.json({
      message: `Enrollment ${status} successfully`,
      enrollment: updated,
    });
  } catch (error) {
    console.error('Instructor enrollment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user, isInstructor, isAdmin } = await requireInstructorOrAdmin();
    if (error) return error;

    const body = await request.json();
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Instructors can only delete enrollments for their own courses
    if (!(await verifyEnrollmentAccess(enrollment.courseId, user?.id, isInstructor))) {
      return NextResponse.json({ error: 'Forbidden: You can only delete enrollments for your own courses' }, { status: 403 });
    }

    const userId = enrollment.userId;
    const courseId = enrollment.courseId; // This is the slug

    // Delete the enrollment
    await db.enrollment.delete({ where: { id: enrollmentId } });

    // Remove student's progress for this course
    await db.courseProgress.deleteMany({ where: { userId, courseId } });

    // Lock all modules by deleting unlocks for this course's modules
    const course = await db.course.findUnique({ where: { slug: courseId } });
    if (course) {
      const courseModuleIds = await db.courseModule.findMany({
        where: { courseId: course.id },
        select: { id: true },
      });
      if (courseModuleIds.length > 0) {
        await db.moduleUnlock.deleteMany({
          where: {
            userId,
            moduleId: { in: courseModuleIds.map(m => m.id) },
          },
        });
      }
    }

    // Notify user
    await db.notification.create({
      data: {
        userId,
        title: 'Enrollment Removed',
        message: `Your enrollment in "${enrollment.courseName}" has been removed. Your progress and module access have been reset.`,
        type: 'warning',
      },
    });

    return NextResponse.json({
      message: 'Enrollment deleted successfully. Progress and module access removed.',
    });
  } catch (error) {
    console.error('Instructor enrollment delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
