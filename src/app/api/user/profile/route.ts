import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, phone, company } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      phone: phone || null,
      company: company || null,
    };

    if (username !== undefined && username !== null && username.trim() !== '') {
      const normalized = username.toLowerCase().trim();
      if (normalized.length >= 3 && /^[a-z0-9_]+$/.test(normalized)) {
        const existing = await db.user.findUnique({ where: { username: normalized } });
        if (existing && existing.id !== user.id) {
          return NextResponse.json({ error: 'This username is already taken' }, { status: 409 });
        }
        updateData.username = normalized;
      }
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, email: true, username: true, phone: true, company: true, avatar: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
