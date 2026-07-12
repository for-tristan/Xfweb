import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * Lightweight ban-check endpoint polled by BanCheckPoller every 10 seconds.
 *
 * Checks IP + device + email bans. Returns { banned: boolean, ...banInfo }
 * If banned, the client redirects to /banned immediately.
 *
 * No logging — this endpoint is called frequently and would flood the logs.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') || '';
    const deviceId = request.cookies.get('xfoundry_device_id')?.value || '';
    const user = await getCurrentUser().catch(() => null);

    const [ipBan, deviceBan, emailBan] = await Promise.all([
      ip ? db.bannedIp.findUnique({ where: { ip } }) : null,
      deviceId ? db.bannedDevice.findUnique({ where: { deviceId } }) : null,
      user?.email ? db.bannedEmail.findUnique({ where: { email: user.email } }) : null,
    ]);

    if (ipBan) {
      // Invalidate session
      if (user) await db.session.deleteMany({ where: { userId: user.id } }).catch(() => {});
      return NextResponse.json({
        banned: true,
        banType: 'ip',
        ip,
        reason: ipBan.reason || 'Your IP address has been banned',
      });
    }

    if (deviceBan) {
      if (user) await db.session.deleteMany({ where: { userId: user.id } }).catch(() => {});
      return NextResponse.json({
        banned: true,
        banType: 'device',
        device: deviceId,
        reason: deviceBan.reason || 'Your device has been banned',
      });
    }

    if (emailBan) {
      if (user) await db.session.deleteMany({ where: { userId: user.id } }).catch(() => {});
      return NextResponse.json({
        banned: true,
        banType: 'email',
        email: user!.email,
        reason: emailBan.reason || 'Your email address has been banned',
      });
    }

    return NextResponse.json({ banned: false });
  } catch {
    // DB down — fail open
    return NextResponse.json({ banned: false });
  }
}
