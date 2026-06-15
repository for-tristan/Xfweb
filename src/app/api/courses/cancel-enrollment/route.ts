import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    // Verify the enrollment belongs to the current user
    const enrollment = await db.enrollment.findFirst({
      where: {
        id: enrollmentId,
        userId: user.id,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    if (enrollment.deletedAt) {
      return NextResponse.json(
        { error: 'Enrollment already cancelled' },
        { status: 400 }
      );
    }

    const userId = enrollment.userId;
    const courseId = enrollment.courseId; // This is the slug

    // Soft delete the enrollment by setting deletedAt
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: { deletedAt: new Date() },
    });


    // 1. Delete student's progress for this course
    await db.courseProgress.deleteMany({
      where: { userId, courseId },
    });

    // 2. Delete study sessions for this course
    await db.studySession.deleteMany({
      where: { userId, courseId },
    });

    // 3. Delete certificates for this course
    await db.certificate.deleteMany({
      where: { userId, courseId },
    });

    // 4. Resolve slug to CUID for module-based lookups
    //    (Enrollment.courseId stores the slug, CourseModule.courseId stores the CUID)
    const course = await db.course.findUnique({ where: { slug: courseId } });
    if (course) {
      const courseModuleIds = await db.courseModule.findMany({
        where: { courseId: course.id },
        select: { id: true },
      });

      if (courseModuleIds.length > 0) {
        const moduleIds = courseModuleIds.map(m => m.id);

        // 5. Delete module unlocks for this course's modules
        await db.moduleUnlock.deleteMany({
          where: {
            userId,
            moduleId: { in: moduleIds },
          },
        });

        // 6. Delete module study records for this course's modules
        await db.moduleStudy.deleteMany({
          where: {
            userId,
            moduleId: { in: moduleIds },
          },
        });

        // 7. Find all tests for these modules and clean up test-related data
        const tests = await db.moduleTest.findMany({
          where: { moduleId: { in: moduleIds } },
          select: { id: true },
        });

        if (tests.length > 0) {
          const testIds = tests.map(t => t.id);

          // Delete test attempts
          await db.testAttempt.deleteMany({
            where: {
              userId,
              testId: { in: testIds },
            },
          });

          // Delete test unlocks
          await db.testUnlock.deleteMany({
            where: {
              userId,
              testId: { in: testIds },
            },
          });
        }
      }
    }

    // 8. Notify the user
    await db.notification.create({
      data: {
        userId,
        title: 'Enrollment Cancelled',
        message: `You have cancelled your enrollment in "${enrollment.courseName}". All progress and module access have been removed.`,
        type: 'info',
      },
    });

    return NextResponse.json({
      message: 'Enrollment cancelled successfully. Progress and module access removed.',
    });
  } catch (error) {
    console.error('Cancel enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
