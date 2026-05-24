import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getLast7DaysStr(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { action, duration } = body;

    // Default courseId to 'general' if not provided
    const courseId = body.courseId || 'general';

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    if (action !== 'start' && action !== 'stop') {
      return NextResponse.json({ error: 'action must be "start" or "stop"' }, { status: 400 });
    }

    const today = getTodayStr();

    if (action === 'start') {
      // Create or get today's session for this course
      const session = await db.studySession.upsert({
        where: {
          userId_courseId_date: {
            userId: user.id,
            courseId,
            date: today,
          },
        },
        create: {
          userId: user.id,
          courseId,
          duration: 0,
          date: today,
        },
        update: {},
        include: {
          user: {
            select: { name: true, avatar: true },
          },
        },
      });

      return NextResponse.json({
        session,
        courseName: body.courseName || courseId,
      });
    }

    // action === 'stop'
    if (typeof duration !== 'number' || duration < 0) {
      return NextResponse.json({ error: 'duration (number, >= 0) is required for stop action' }, { status: 400 });
    }

    // Find existing session or create one
    const session = await db.studySession.upsert({
      where: {
        userId_courseId_date: {
          userId: user.id,
          courseId,
          date: today,
        },
      },
      create: {
        userId: user.id,
        courseId,
        duration,
        date: today,
      },
      update: {
        duration: {
          increment: duration,
        },
      },
      include: {
        user: {
          select: { name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      session,
      courseName: body.courseName || courseId,
    });
  } catch (error) {
    console.error('Study session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Get all 'general' sessions for this user
    const sessions = await db.studySession.findMany({
      where: { userId: user.id, courseId: 'general' },
      orderBy: { date: 'desc' },
    });

    const today = getTodayStr();
    const last7Days = getLast7DaysStr();

    const todayTotal = sessions
      .filter((s) => s.date === today)
      .reduce((acc, s) => acc + s.duration, 0);

    const weekTotal = sessions
      .filter((s) => last7Days.includes(s.date))
      .reduce((acc, s) => acc + s.duration, 0);

    const allTimeTotal = sessions.reduce((acc, s) => acc + s.duration, 0);

    return NextResponse.json({
      sessions,
      stats: {
        todaySeconds: todayTotal,
        weekSeconds: weekTotal,
        allTimeSeconds: allTimeTotal,
      },
    });
  } catch (error) {
    console.error('Study sessions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
