import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const projects = await db.project.findMany({
      where: { status: 'active' },
      orderBy: { displayOrder: 'asc' },
    });

    const parsed = projects.map(p => ({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
    }));

    return NextResponse.json(
      { projects: parsed },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json({ projects: [] });
  }
}
