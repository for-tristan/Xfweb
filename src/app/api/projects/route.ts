import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

const getProjects = unstable_cache(
  async () => {
    const projects = await db.project.findMany({
      where: { status: 'active' },
      orderBy: { displayOrder: 'asc' },
    });
    return projects.map(p => ({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
    }));
  },
  ['public-projects-v1'],
  { tags: ['public-projects'], revalidate: 60 }
);

export async function GET() {
  try {
    const parsed = await getProjects();

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
