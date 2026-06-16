import { createHash, randomBytes, scryptSync } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('[AUTH] FATAL: SESSION_SECRET environment variable is not set. Session tokens cannot be validated.');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.includes(':')) {
    const legacyMatch = createHash('sha256').update(password + 'x-foundry-salt').digest('hex') === stored;
    if (legacyMatch) {
      console.warn('[AUTH] Legacy SHA-256 password verified. Consider forcing a password reset for this user.');
    }
    return legacyMatch;
  }
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = scryptSync(password, salt, 64).toString('hex');
  return computed === hash;
}

export function createSessionToken(userId: string): string {
  if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not configured. Cannot create session tokens.');
  }
  const randomPart = randomBytes(16).toString('hex');
  return createHash('sha256').update(userId + SESSION_SECRET + randomPart).digest('hex');
}


export const SESSION_INACTIVITY_DAYS = 3;
export const SESSION_MAX_AGE_MS = SESSION_INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

export async function verifySessionToken(userId: string, token: string): Promise<boolean> {
  if (!SESSION_SECRET) return false;

  const session = await db.session.findUnique({
    where: { token },
  });

  if (!session) return false;
  if (session.userId !== userId) return false;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return false;
  }

  const newExpiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  await db.session.update({
    where: { token },
    data: { expiresAt: newExpiresAt },
  }).catch(() => {});

  return true;
}

export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  emailVerified: Date | null;
  phone: string | null;
  company: string | null;
  avatar: string | null;
} | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('xfoundry_user_id')?.value;
  const sessionToken = cookieStore.get('xfoundry_session')?.value;

  if (!userId || !sessionToken) return null;

  const isValidSession = await verifySessionToken(userId, sessionToken);
  if (!isValidSession) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        emailVerified: true,
        phone: true,
        company: true,
        avatar: true,
      },
    });

    return user ? { ...user, username: user.username ?? '', emailVerified: user.emailVerified ?? null } : null;
  } catch {
    return null;
  }
}


export async function createSession(userId: string): Promise<string> {
  const token = createSessionToken(userId);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await db.session.upsert({
    where: { token },
    update: { expiresAt },
    create: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}


export async function deleteSession(token: string): Promise<void> {
  try {
    await db.session.delete({ where: { token } });
  } catch {
  }
}


export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await db.session.deleteMany({ where: { userId } });
  } catch {
  }
}


type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;


export async function requireAdmin(): Promise<{ error: NextResponse | null; user: AuthUser | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null };
  if (user.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }), user: null };
  return { error: null, user };
}


export async function requireInstructor(): Promise<{ error: NextResponse | null; user: AuthUser | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null };
  if (user.role !== 'instructor') return { error: NextResponse.json({ error: 'Forbidden: Instructor access required' }, { status: 403 }), user: null };
  return { error: null, user };
}


export async function requireInstructorOrAdmin(): Promise<{
  error: NextResponse | null;
  user: AuthUser | null;
  isInstructor: boolean;
  isAdmin: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null, isInstructor: false, isAdmin: false };
  const isInstructor = user.role === 'instructor';
  const isAdmin = user.role === 'admin';
  if (!isInstructor && !isAdmin) return { error: NextResponse.json({ error: 'Forbidden: Instructor or Admin access required' }, { status: 403 }), user: null, isInstructor: false, isAdmin: false };
  return { error: null, user, isInstructor, isAdmin };
}
