import { db } from '@/lib/db';

/**
 * Ban check helpers.
 *
 * IP bans are checked in middleware (edge) + at the API level.
 * Email bans are checked at signup + login.
 *
 * Both are stored in the DB (BannedIp / BannedEmail tables) and
 * managed via the admin panel.
 */

export async function isIpBanned(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;
  try {
    const ban = await db.bannedIp.findUnique({ where: { ip } });
    return !!ban;
  } catch {
    // If DB is down, don't block — fail open
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

export async function unbanIp(ip: string): Promise<void> {
  await db.bannedIp.delete({ where: { ip } }).catch(() => {});
}

export async function unbanEmail(email: string): Promise<void> {
  await db.bannedEmail.delete({ where: { email: email.toLowerCase().trim() } }).catch(() => {});
}
