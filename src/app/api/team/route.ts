import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

const getTeamMembers = unstable_cache(
  async () => {
    const members = await db.teamMember.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return members;
  },
  ['public-team-v1'],
  { tags: ['public-team'], revalidate: 60 }
);

export async function GET() {
  try {
    const members = await getTeamMembers();

    return NextResponse.json(
      { members },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Public team members fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
