import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * Public course detail endpoint.
 *
 * SECURITY: Returns course metadata ONLY — no module content.
 * Module content is gated behind enrollment + module-unlock checks
 * in /api/courses/[slug]/combined and /api/courses/modules.
 *
 * Previously this route returned the full `modules[].content` for ANY
 * course (including drafts) to ANY caller (no auth check). That
 * bypassed the entire enrollment/approval/payment gating model.
 *
 * Now:
 * 1. Only returns courses with status 'active' (drafts/archived are 404)
 * 2. Strips `content` from every module in the response
 * 3. Returns only module metadata (id, title, description, moduleOrder)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const course = await db.course.findFirst({
      where: { slug, status: 'active' },
      include: {
        modules: {
          orderBy: { moduleOrder: 'asc' },
          select: {
            // SECURITY: explicitly exclude `content` — it's premium
            // material gated behind enrollment + unlock.
            id: true,
            title: true,
            description: true,
            moduleOrder: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Also call getCurrentUser so the React cache() is warmed for any
    // subsequent combined-endpoint call the client makes. No auth
    // requirement here — course metadata is public.
    await getCurrentUser().catch(() => null);

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
