import { createHash, randomBytes, scryptSync } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'x-foundry-session-secret-2026';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  // Legacy format: plain sha256 hex (64 chars, no colon)
  if (!stored.includes(':')) {
    return createHash('sha256').update(password + 'x-foundry-salt').digest('hex') === stored;
  }
  // New format: salt:hash
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = scryptSync(password, salt, 64).toString('hex');
  return computed === hash;
}

export function createSessionToken(userId: string): string {
  // Use randomBytes for the random component instead of just Date.now()
  const randomPart = randomBytes(16).toString('hex');
  return createHash('sha256').update(userId + SESSION_SECRET + randomPart).digest('hex');
}

export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  phone: string | null;
  company: string | null;
  avatar: string | null;
} | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('xfoundry_user_id')?.value;

  if (!userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        company: true,
        avatar: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}
