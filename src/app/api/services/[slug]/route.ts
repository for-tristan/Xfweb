import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

/**
 * Single-service endpoint — fetches ONE service (with features) by slug.
 *
 * Previously the services/[slug] page fetched /api/services (which returns
 * ALL active services) and filtered client-side. That meant every service
 * detail page downloaded the full services list, even though it only needed
 * one record.
 *
 * This endpoint mirrors the /api/courses/[slug]/combined pattern: one
 * targeted DB query, CDN-cached, returns only what the page needs.
 */
async function getServiceBySlug(slug: string) {
  return db.service.findFirst({
    where: { slug, status: 'active' },
    include: {
      features: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });
}

// Cache per-slug — key includes the slug so different slugs get different
// cache entries. revalidate: 60s matches the existing /api/services cache.
const getCachedService = unstable_cache(
  async (slug: string) => getServiceBySlug(slug),
  ['public-service-by-slug-v1'],
  { tags: ['public-services'], revalidate: 60 }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    const service = await getCachedService(slug);

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { service },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Public service by slug fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
