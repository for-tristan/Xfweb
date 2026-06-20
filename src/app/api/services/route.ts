import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const services = await db.service.findMany({
      where: { status: 'active' },
      include: {
        features: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    console.log('[Public GET /api/services] returning', services.length, 'services:', services.map(s => ({ id: s.id, title: s.title, status: s.status, displayOrder: s.displayOrder })));

    return NextResponse.json(
      { services },
      {
        headers: {
          // Admins need to see mutations appear immediately. We rely on
          // revalidatePath in the admin mutation handlers, but to be
          // 100% sure no stale response is served by the browser HTTP
          // cache or Vercel CDN, we mark this as no-store.
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Public services fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
