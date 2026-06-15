import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendEnrollmentStatusEmail } from '@/lib/email';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = { deletedAt: null };
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
    console.error('Admin enrollments fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user: adminUser } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { enrollmentId, status } = body;

    if (!enrollmentId || !status) {
      return NextResponse.json(
        { error: 'Enrollment ID and status are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "approved" or "declined"' },
        { status: 400 }
      );
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    if (enrollment.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot update a cancelled enrollment' },
        { status: 400 }
      );
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

    if (status === 'approved') {
      await db.notification.create({
        data: {
          userId: updated.userId,
          title: 'Enrollment Approved',
          message: `Your enrollment in "${updated.courseName}" has been approved! You can now access the course materials.`,
          type: 'success',
        },
      });

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
            create: { userId: updated.userId, moduleId: firstModule.id, unlockedBy: adminUser!.id },
            update: {},
          });
        }
      }
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

    try {
      await sendEnrollmentStatusEmail({
        userName: updated.user.name,
        userEmail: updated.user.email,
        courseName: updated.courseName,
        status: status as 'approved' | 'declined',
      });
    } catch (emailErr: any) {
      console.error('[Enrollments] Email send failed:', emailErr?.message || emailErr);
    }

    return NextResponse.json({
      message: `Enrollment ${status} successfully`,
      enrollment: updated,
    });
  } catch (error) {
    console.error('Admin enrollment update error:', error);
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
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const userId = enrollment.userId;
    const courseId = enrollment.courseId;

    await db.enrollment.delete({
      where: { id: enrollmentId },
    });

    await db.courseProgress.deleteMany({
      where: { userId, courseId },
    });

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

    await db.notification.create({
      data: {
        userId,
        title: 'Enrollment Removed',
        message: `Your enrollment in "${enrollment.courseName}" has been removed by an admin. Your progress and module access have been reset.`,
        type: 'warning',
      },
    });

    return NextResponse.json({
      message: 'Enrollment deleted successfully. Progress and module access removed.',
    });
  } catch (error) {
    console.error('Admin enrollment delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
