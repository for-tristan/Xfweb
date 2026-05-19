import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const progress = await db.courseProgress.findMany({
      where: { userId: user.id },
      orderBy: { lastAccessed: 'desc' },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: 'Progress tracking is managed by administrators' }, { status: 403 });
}
