import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

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
    const { courseId, courseName, courseLevel, duration, phone, experienceLevel, motivation } = body;

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

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Save the phone number to the user's profile if they don't have one,
    // or update it if a new one was provided. This ensures admins can
    // contact the student about their enrollment.
    if (phone.trim() && user.phone !== phone.trim()) {
      await db.user.update({
        where: { id: user.id },
        data: { phone: phone.trim() },
      });
    }

    const existingEnrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
        deletedAt: null,
      },
    });

    if (existingEnrollment) {
      await logRequest(request, 'COURSE_ENROLL_FAILED', {
        userId: user.id,
        email: user.email,
        details: `Duplicate enrollment attempt for course "${courseName}" (courseId: ${courseId})`,
        status: 409,
      });
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

    await logRequest(request, 'COURSE_ENROLL', {
      userId: user.id,
      email: user.email,
      details: `Enrolled in course "${courseName}" (courseId: ${courseId}, level: ${courseLevel || 'Beginner'}, duration: ${duration || 'Self-paced'})`,
      status: 200,
    });

    return NextResponse.json({
      message: 'Enrolled successfully!',
      enrollment,
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    await logRequest(request, 'COURSE_ENROLL_FAILED', {
      userId: user?.id,
      email: user?.email,
      details: `Server error during enrollment (courseId: ${courseId ?? 'unknown'}, courseName: ${courseName ?? 'unknown'}): ${(error as Error).message}`,
      status: 500,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
