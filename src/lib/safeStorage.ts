/**
 * Safe localStorage wrappers.
 *
 * Edge (and Safari private mode, and some iframe contexts) throw
 * "Access is denied" when you try to read or write localStorage.
 * These wrappers catch the error and return null / do nothing,
 * so the app degrades gracefully instead of crashing the page.
 *
 * ALWAYS use these instead of raw localStorage.getItem/setItem.
 */

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage blocked (Edge strict privacy, Safari private mode, etc.)
    // App still works — theme just won't persist across reloads.
  }
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

/**
 * SECURITY: Strip PII from a user object before caching it in
 * sessionStorage. The full user object from /api/auth/me includes
 * email and phone — both are PII that shouldn't sit in JS-accessible
 * storage where any XSS could read them.
 *
 * The cached object is only used by the Edge-fallback path (when
 * cookies are blocked and the SPA needs to show the user as logged-in
 * on first paint). For that purpose, only id/username/role/avatar are
 * needed — email and phone are NOT needed for UI rendering.
 *
 * Returns a new object (does not mutate the input).
 */
export function stripPiiForCache(user: Record<string, any>): Record<string, any> {
  if (!user || typeof user !== 'object') return {};
  const { email, phone, company, ...safe } = user;
  return safe;
}

