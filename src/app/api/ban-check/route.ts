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

    // Debug: log what we're checking (helps diagnose ban issues)
    console.log('[ban-check] Checking:', { ip: !!ip, deviceId: deviceId ? deviceId.substring(0, 16) + '...' : 'none', email: user?.email || 'none' });

    const [ipBan, deviceBan, emailBan] = await Promise.all([
      ip ? db.bannedIp.findUnique({ where: { ip } }).catch(e => { console.error('[ban-check] IP query error:', e.message); return null; }) : null,
      deviceId ? db.bannedDevice.findUnique({ where: { deviceId } }).catch(e => { console.error('[ban-check] Device query error:', e.message); return null; }) : null,
      user?.email ? db.bannedEmail.findUnique({ where: { email: user.email } }).catch(e => { console.error('[ban-check] Email query error:', e.message); return null; }) : null,
    ]);

    if (ipBan) {
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
  } catch (error: any) {
    console.error('[ban-check] FATAL:', error?.message || error);
    return NextResponse.json({ banned: false, error: 'ban-check failed' });
  }
}
