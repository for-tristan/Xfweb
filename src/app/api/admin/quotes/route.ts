import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const quotes = await db.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Admin quotes fetch error:', error);
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'reviewed', 'replied'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await db.quoteRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const quote = await db.quoteRequest.update({
      where: { id },
      data: { status },
    });

    if (status === 'replied' && existing.status !== 'replied') {
      try {
        await db.notification.create({
          data: {
            userId: existing.userId,
            title: 'Quote Request Updated',
            message: `Your "${existing.serviceType}" quote request has been marked as replied. Check your email for details.`,
            type: 'success',
          },
        });
      } catch {}
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Admin quote update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
