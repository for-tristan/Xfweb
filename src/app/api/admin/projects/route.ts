import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

/** Bust CDN/edge cache for the public projects list + landing page. */
function bustProjectsCache() {
  try {
    revalidatePath('/api/projects');
    revalidatePath('/');
  } catch {
    /* no-op in dev / non-Vercel runtimes */
  }
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const projects = await db.project.findMany({
      orderBy: { displayOrder: 'asc' },
      take: 100,
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Admin projects fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { title, slug, description, category, tags, icon, imageUrl, projectUrl, status, displayOrder } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        title,
        slug,
        description: description || '',
        category: category || 'web',
        tags: tags || '[]',
        icon: icon || 'fa-solid fa-code',
        imageUrl: imageUrl || '',
        projectUrl: projectUrl || '',
        status: status || 'active',
        displayOrder: displayOrder ?? 0,
      },
    });

    bustProjectsCache();
    await logRequest(request, 'ADMIN_PROJECT_CREATE', {
      details: `Created project "${title}" (slug=${slug}, id=${project.id}, category=${category || 'web'})`,
      status: 201,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('Admin project create error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A project with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id, title, slug, description, category, tags, icon, imageUrl, projectUrl, status, displayOrder } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = await db.project.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(icon !== undefined && { icon }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(projectUrl !== undefined && { projectUrl }),
        ...(status !== undefined && { status }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    bustProjectsCache();
    await logRequest(request, 'ADMIN_PROJECT_UPDATE', {
      details: `Updated project id=${id} ("${existing.title}", slug=${existing.slug})${status !== undefined ? ` status=${status}` : ''}`,
      status: 200,
    });
    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Admin project update error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A project with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await db.project.delete({ where: { id } });

    bustProjectsCache();
    await logRequest(request, 'ADMIN_PROJECT_DELETE', {
      details: `Deleted project id=${id} ("${existing.title}", slug=${existing.slug})`,
      status: 200,
    });
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Admin project delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
