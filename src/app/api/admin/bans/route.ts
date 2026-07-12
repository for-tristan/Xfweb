import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logRequest } from '@/lib/activityLog';

/**
 * Admin ban management endpoint.
 *
 * GET    — list all banned IPs + emails + devices
 * POST   — ban an IP, email, or device { type: 'ip'|'email'|'device', value, reason }
 * DELETE — unban an IP, email, or device { type, value }
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const [bannedIps, bannedEmails, bannedDevices] = await Promise.all([
      db.bannedIp.findMany({ orderBy: { createdAt: 'desc' } }),
      db.bannedEmail.findMany({ orderBy: { createdAt: 'desc' } }),
      db.bannedDevice.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({ bannedIps, bannedEmails, bannedDevices });
  } catch (error) {
    console.error('Admin bans fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { type, value, reason } = body;

    if (!type || !value) {
      return NextResponse.json({ error: 'type and value are required' }, { status: 400 });
    }

    if (type === 'ip') {
      await db.bannedIp.upsert({
        where: { ip: value },
        update: { reason: reason || null, bannedBy: user!.id },
        create: { ip: value, reason: reason || null, bannedBy: user!.id },
      });
    } else if (type === 'email') {
      const normalized = value.toLowerCase().trim();
      await db.bannedEmail.upsert({
        where: { email: normalized },
        update: { reason: reason || null, bannedBy: user!.id },
        create: { email: normalized, reason: reason || null, bannedBy: user!.id },
      });
    } else if (type === 'device') {
      await db.bannedDevice.upsert({
        where: { deviceId: value },
        update: { reason: reason || null, bannedBy: user!.id },
        create: { deviceId: value, reason: reason || null, bannedBy: user!.id },
      });
    } else {
      return NextResponse.json({ error: 'type must be "ip", "email", or "device"' }, { status: 400 });
    }

    await logRequest(request, 'ADMIN_BAN_ADD', {
      userId: user!.id,
      email: user!.email,
      details: `Banned ${type}: ${value}${reason ? ` (reason: ${reason})` : ''}`,
      status: 200,
    });

    return NextResponse.json({ message: `${type} banned successfully` });
  } catch (error) {
    console.error('Admin ban add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { type, value } = body;

    if (!type || !value) {
      return NextResponse.json({ error: 'type and value are required' }, { status: 400 });
    }

    if (type === 'ip') {
      await db.bannedIp.delete({ where: { ip: value } }).catch(() => {});
    } else if (type === 'email') {
      await db.bannedEmail.delete({ where: { email: value.toLowerCase().trim() } }).catch(() => {});
    } else if (type === 'device') {
      await db.bannedDevice.delete({ where: { deviceId: value } }).catch(() => {});
    } else {
      return NextResponse.json({ error: 'type must be "ip", "email", or "device"' }, { status: 400 });
    }

    await logRequest(request, 'ADMIN_BAN_REMOVE', {
      userId: user!.id,
      email: user!.email,
      details: `Unbanned ${type}: ${value}`,
      status: 200,
    });

    return NextResponse.json({ message: `${type} unbanned successfully` });
  } catch (error) {
    console.error('Admin ban remove error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
