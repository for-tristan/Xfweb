import { db } from '@/lib/db';

/**
 * Ban check helpers.
 *
 * IP bans are checked in the root layout (server-side) + at the API level.
 * Email bans are checked at signup + login.
 * Device bans are checked at the root layout (via cookie) + signup + login.
 *
 * All are stored in the DB (BannedIp / BannedEmail / BannedDevice tables)
 * and managed via the admin panel.
 */

export async function isIpBanned(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;
  try {
    const ban = await db.bannedIp.findUnique({ where: { ip } });
    return !!ban;
  } catch {
    return false;
  }
}

export async function isEmailBanned(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const normalized = email.toLowerCase().trim();
    const ban = await db.bannedEmail.findUnique({ where: { email: normalized } });
    return !!ban;
  } catch {
    return false;
  }
}

export async function isDeviceBanned(deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  try {
    const ban = await db.bannedDevice.findUnique({ where: { deviceId } });
    return !!ban;
  } catch {
    return false;
  }
}

export async function banIp(ip: string, reason?: string, bannedBy?: string): Promise<void> {
  await db.bannedIp.upsert({
    where: { ip },
    update: { reason, bannedBy },
    create: { ip, reason, bannedBy },
  });
}

export async function banEmail(email: string, reason?: string, bannedBy?: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  await db.bannedEmail.upsert({
    where: { email: normalized },
    update: { reason, bannedBy },
    create: { email: normalized, reason, bannedBy },
  });
}

export async function banDevice(deviceId: string, reason?: string, bannedBy?: string): Promise<void> {
  await db.bannedDevice.upsert({
    where: { deviceId },
    update: { reason, bannedBy },
    create: { deviceId, reason, bannedBy },
  });
}

export async function unbanIp(ip: string): Promise<void> {
  await db.bannedIp.delete({ where: { ip } }).catch(() => {});
}

export async function unbanEmail(email: string): Promise<void> {
  await db.bannedEmail.delete({ where: { email: email.toLowerCase().trim() } }).catch(() => {});
}

export async function unbanDevice(deviceId: string): Promise<void> {
  await db.bannedDevice.delete({ where: { deviceId } }).catch(() => {});
}
