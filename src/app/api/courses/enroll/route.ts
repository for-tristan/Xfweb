import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, courseName, courseLevel, duration, experienceLevel, motivation } = body;

    if (!courseId || !courseName) {
      return NextResponse.json(
        { error: 'Course ID and name are required' },
        { status: 400 }
      );
    }

    if (!experienceLevel || !motivation) {
      return NextResponse.json(
        { error: 'Experience level and motivation are required' },
        { status: 400 }
      );
    }

    const existingEnrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
        deletedAt: null,
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 409 }
      );
    }

    const enrollment = await db.enrollment.create({
      data: {
        userId: user.id,
        courseId,
        courseName,
        courseLevel: courseLevel || 'Beginner',
        duration: duration || 'Self-paced',
        experienceLevel: experienceLevel || null,
        motivation: motivation || null,
      },
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Enrollment Request Submitted',
        message: `Your enrollment request for "${courseName}" has been submitted. An admin will review it shortly.`,
        type: 'info',
      },
    });

    return NextResponse.json({
      message: 'Enrolled successfully!',
      enrollment,
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
