import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const course = await db.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { moduleOrder: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const parsed = {
      ...course,
      features: JSON.parse(course.features || '[]'),
      moduleCount: course.modules.length,
    };

    return NextResponse.json({ course: parsed });
  } catch (error) {
    console.error('Public course detail fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
