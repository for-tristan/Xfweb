import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

const getServices = unstable_cache(
  async () => {
    const services = await db.service.findMany({
      where: { status: 'active' },
      include: {
        features: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
    return services;
  },
  ['public-services-v1'],
  { tags: ['public-services'], revalidate: 60 }
);

export async function GET(request: NextRequest) {
  try {
    const services = await getServices();

    return NextResponse.json(
      { services },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
