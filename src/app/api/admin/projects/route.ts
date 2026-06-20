import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/** Bust CDN/edge cache for the public projects list + landing page. */
function bustProjectsCache() {
  try {
    revalidatePath('/api/projects');
    revalidatePath('/');
  } catch {
    /* no-op in dev / non-Vercel runtimes */
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

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const projects = await db.project.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Admin projects fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
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
    const { error } = await requireAdmin();
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
    const { error } = await requireAdmin();
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
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Admin project delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
