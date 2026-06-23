import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * Bust CDN/edge cache for the public services list + any page that renders
 * services. revalidatePath purges the route cache; the unstable_cache on
 * /api/services also refreshes via its revalidate: 60 TTL.
 */
function bustServicesCache() {
  try {
    revalidatePath('/api/services');
    revalidatePath('/');
    revalidatePath('/services', 'page');
  } catch {
    /* revalidatePath is a no-op in dev / non-Vercel runtimes */
  }
}

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

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const services = await db.service.findMany({
      include: {
        features: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Admin services fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { title, slug, description, icon, features } = body;

    console.log('[Admin POST /api/admin/services] incoming body:', { title, slug, description, icon, featuresCount: features?.length || 0 });

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'title and slug are required' },
        { status: 400 }
      );
    }

    const service = await db.service.create({
      data: {
        title,
        slug,
        description: description || '',
        icon: icon || 'fa-solid fa-code',
        features: {
          create: (features || []).map(
            (f: { title: string; description?: string; icon?: string }, index: number) => ({
              title: f.title,
              description: f.description || '',
              icon: f.icon || '',
              displayOrder: index,
            })
          ),
        },
      },
      include: {
        features: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    console.log('[Admin POST /api/admin/services] created service:', { id: service.id, title: service.title, status: service.status, displayOrder: service.displayOrder });
    bustServicesCache();
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Admin service create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id, title, slug, description, icon, status, displayOrder, features } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    if (features !== undefined) {
      await db.serviceFeature.deleteMany({ where: { serviceId: id } });
    }

    const service = await db.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(status !== undefined && { status }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(features !== undefined && {
          features: {
            create: features.map(
              (f: { title: string; description?: string; icon?: string; displayOrder?: number }, index: number) => ({
                title: f.title,
                description: f.description || '',
                icon: f.icon || '',
                displayOrder: f.displayOrder !== undefined ? f.displayOrder : index,
              })
            ),
          },
        }),
      },
      include: {
        features: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    bustServicesCache();
    return NextResponse.json({ service });
  } catch (error) {
    console.error('Admin service update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    await db.service.delete({ where: { id } });

    bustServicesCache();
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Admin service delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
