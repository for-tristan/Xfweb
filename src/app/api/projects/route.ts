import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/projects — public endpoint, returns active projects only
export async function GET() {
  try {
    const projects = await db.project.findMany({
      where: { status: 'active' },
      orderBy: { displayOrder: 'asc' },
    });

    // Parse tags from JSON string
    const parsed = projects.map(p => ({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
    }));

    return NextResponse.json({ projects: parsed });
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json({ projects: [] });
  }
}
