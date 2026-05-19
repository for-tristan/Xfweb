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

    // Soft delete by setting deletedAt
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      message: 'Enrollment cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
