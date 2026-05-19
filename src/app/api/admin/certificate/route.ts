import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createHash } from 'crypto';

const COURSE_NAMES: Record<string, string> = {
  'ml-bootcamp': 'ML Engineer Bootcamp',
  'linux-basics': 'Linux Basics & Customization',
};

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

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'userId and courseId are required' }, { status: 400 });
    }

    // Get the student
    const student = await db.user.findUnique({ where: { id: userId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if a certificate already exists for this student/course
    const existingCert = await db.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existingCert) {
      return NextResponse.json({
        error: `Certificate already issued (ID: ${existingCert.certificateId})`,
        certificateId: existingCert.certificateId,
      }, { status: 400 });
    }

    // Check progress is at 100%
    const progress = await db.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!progress) {
      return NextResponse.json({ error: 'No progress record found for this student/course' }, { status: 404 });
    }

    const completedModules: number[] = JSON.parse(progress.completedModules || '[]');
    const totalModules = await db.courseModule.count({ where: { courseId } });

    if (completedModules.length < totalModules) {
      return NextResponse.json({
        error: 'Cannot issue certificate: student has not completed all modules',
        completed: completedModules.length,
        total: totalModules,
      }, { status: 400 });
    }

    // Generate certificate
    const certSeed = `${userId}-${courseId}-${Date.now()}`;
    const certificateId = `XF-${createHash('sha256').update(certSeed).digest('hex').substring(0, 12).toUpperCase()}`;
    const completionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const courseName = COURSE_NAMES[courseId] || courseId;

    // Save certificate to database
    await db.certificate.create({
      data: {
        userId,
        courseId,
        courseName,
        certificateId,
        completionDate,
      },
    });

    // Notify student
    await db.notification.create({
      data: {
        userId,
        title: 'Certificate of Completion',
        message: `Congratulations! You have earned a certificate for completing "${courseName}". Certificate ID: ${certificateId}. Go to your course page to download your PDF certificate.`,
        type: 'success',
      },
    });

    return NextResponse.json({
      message: `Certificate issued for ${student.name}. They can now download it from the course page.`,
      certificateId,
      completionDate,
      courseName,
      studentName: student.name,
      studentEmail: student.email,
    });
  } catch (error) {
    console.error('Admin certificate issue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
