import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

/** Bust CDN/edge cache for the public team list + landing page. */
function bustTeamCache() {
  try {
    revalidatePath('/api/team');
    revalidatePath('/');
  } catch {
    /* no-op in dev / non-Vercel runtimes */
  }
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
    const { error, user } = await requireAdmin();
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
    await logRequest(request, 'ADMIN_TEAM_ADD', {
      userId: user?.id,
      email: user?.email,
      details: `Added team member "${name}" (role="${role}", id=${member.id})`,
      status: 201,
    });
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
    const { error, user } = await requireAdmin();
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
    await logRequest(request, 'ADMIN_TEAM_UPDATE', {
      userId: user?.id,
      email: user?.email,
      details: `Updated team member id=${id} ("${existing.name}", role="${existing.role}")`,
      status: 200,
    });
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
    const { error, user } = await requireAdmin();
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
    await logRequest(request, 'ADMIN_TEAM_DELETE', {
      userId: user?.id,
      email: user?.email,
      details: `Deleted team member id=${id} ("${existing.name}", role="${existing.role}")`,
      status: 200,
    });
    return NextResponse.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Admin team member delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
