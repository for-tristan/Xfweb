import { createHash, randomBytes, scryptSync } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

// SECURITY: No fallback — throw if SESSION_SECRET is not set
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
  // Legacy format: plain sha256 hex (64 chars, no colon)
  if (!stored.includes(':')) {
    const legacyMatch = createHash('sha256').update(password + 'x-foundry-salt').digest('hex') === stored;
    if (legacyMatch) {
      console.warn('[AUTH] Legacy SHA-256 password verified. Consider forcing a password reset for this user.');
    }
    return legacyMatch;
  }
  // New format: salt:hash
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

/**
 * Validates a session token against a user ID.
 * The token is: sha256(userId + SESSION_SECRET + randomPart)
 * We store the token in the xfoundry_session cookie and the userId in xfoundry_user_id.
 * To validate, we check that the token could have been generated for this userId.
 * Since the random part is embedded in the hash, we need a different approach:
 * We store a hash of (userId + token) in the database or validate it differently.
 *
 * Approach: Store session tokens in the database for proper validation.
 * For now, we use a simpler verification: the token must equal sha256(userId + SESSION_SECRET + randomPart)
 * Since we can't recover randomPart from the hash, we store the token alongside the user.
 *
 * Simple secure approach: store the session token in the database (Session table).
 * But for minimal disruption, we use a HMAC-like approach:
 * Token = sha256(userId + SESSION_SECRET + randomPart)
 * We store the token. To validate: we check if the stored token matches for this userId.
 *
 * Best minimal fix: Store session tokens in a Session model and validate against it.
 */
export const SESSION_INACTIVITY_DAYS = 3;
export const SESSION_MAX_AGE_MS = SESSION_INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

export async function verifySessionToken(userId: string, token: string): Promise<boolean> {
  if (!SESSION_SECRET) return false;

  // Look up active sessions for this user
  const session = await db.session.findUnique({
    where: { token },
  });

  if (!session) return false;
  if (session.userId !== userId) return false;
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await db.session.delete({ where: { token } }).catch(() => {});
    return false;
  }

  // ── Rolling expiry: extend session by 3 days on each valid request ──
  // If the user is active, their session keeps getting renewed.
  // If they don't visit for 3 days, the session naturally expires.
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

  // SECURITY: Validate the session token against the database
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

/**
 * Create a session record in the database and return the token.
 * Call this after successful login/signup/OAuth.
 */
export async function createSession(userId: string): Promise<string> {
  const token = createSessionToken(userId);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS); // 3 days (rolling)

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

/**
 * Delete a session (for logout).
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    await db.session.delete({ where: { token } });
  } catch {
    // Session may already be deleted
  }
}

/**
 * Delete all sessions for a user (for password reset, role change, etc.)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await db.session.deleteMany({ where: { userId } });
  } catch {
    // Ignore errors
  }
}
