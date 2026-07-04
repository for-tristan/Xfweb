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
