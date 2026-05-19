import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const SESSION_SECRET = 'x-foundry-session-secret-2026';

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'x-foundry-salt').digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function createSessionToken(userId: string): string {
  return createHash('sha256').update(userId + SESSION_SECRET + Date.now().toString()).digest('hex');
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
