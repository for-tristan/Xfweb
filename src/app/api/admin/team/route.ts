import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/** Bust CDN/edge cache for the public team list + landing page. */
function bustTeamCache() {
  try {
    revalidateTag('public-team');
    revalidateTag('landing');
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

    const members = await db.teamMember.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Admin team members fetch error:', error);
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
    const { name, role, bio, avatar, icon, linkedinUrl, githubUrl, displayOrder } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: 'name and role are required' },
        { status: 400 }
      );
    }

    const member = await db.teamMember.create({
      data: {
        name,
        role,
        bio: bio || '',
        avatar: avatar || '',
        icon: icon || 'fa-solid fa-user-tie',
        linkedinUrl: linkedinUrl || '',
        githubUrl: githubUrl || '',
        displayOrder: displayOrder ?? 0,
      },
    });

    bustTeamCache();
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Admin team member create error:', error);
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
    const { id, name, role, bio, avatar, icon, linkedinUrl, githubUrl, displayOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const existing = await db.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    const member = await db.teamMember.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(icon !== undefined && { icon }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    bustTeamCache();
    return NextResponse.json({ member });
  } catch (error) {
    console.error('Admin team member update error:', error);
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

    const existing = await db.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    await db.teamMember.delete({ where: { id } });

    bustTeamCache();
    return NextResponse.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Admin team member delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
