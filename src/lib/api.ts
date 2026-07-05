/**
 * Shared API helpers — eliminates repeated boilerplate across route handlers.
 *
 * Every route handler in this codebase does the same 5 things:
 *   1. Parse + validate the request body
 *   2. Authenticate the user (requireAdmin / requireInstructor / etc.)
 *   3. Query the database
 *   4. Bust cache if needed
 *   5. Return JSON or an error
 *
 * These helpers make steps 1, 2, and 5 one-liners so the route body is
 * just the business logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Error responses — consistent shape across all routes
// ---------------------------------------------------------------------------

export function badRequest(message = 'Bad request') {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = 'Not authenticated') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message = 'Conflict') {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function tooManyRequests(message = 'Too many requests. Please try again later.', retryAfter?: number) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      ...(retryAfter ? { headers: { 'Retry-After': String(retryAfter) } } : {}),
    }
  );
}

export function serverError(message = 'Internal server error', context?: string) {
  if (context) console.error(`[${context}]`, message);
  return NextResponse.json({ error: message }, { status: 500 });
}

// ---------------------------------------------------------------------------
// Body parsing + validation
// ---------------------------------------------------------------------------

/**
 * Parse + validate a JSON request body against a Zod schema.
 * Returns `[data, null]` on success, `[null, errorResponse]` on failure.
 *
 * Usage:
 *   const [body, error] = await parseBody(request, schema);
 *   if (error) return error;
 *   // body is now typed as z.infer<typeof schema>
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<[z.infer<T> | null, NextResponse | null]> {
  try {
    const json = await request.json();
    const result = schema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return [null, badRequest(firstError?.message || 'Invalid request body')];
    }
    return [result.data, null];
  } catch {
    return [null, badRequest('Invalid JSON body')];
  }
}

/**
 * Parse a JSON body without schema validation. Use only for read-only
 * routes where the body shape is trivial. Prefer parseBody + Zod.
 */
export async function parseJsonBody<T = any>(request: NextRequest): Promise<[T | null, NextResponse | null]> {
  try {
    const json = await request.json();
    return [json as T, null];
  } catch {
    return [null, badRequest('Invalid JSON body')];
  }
}

// ---------------------------------------------------------------------------
// Pagination — shared query param parsing
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page: number;
  limit: number;
  paginating: boolean;
}

/**
 * Extract pagination params from a request URL.
 * - If neither `page` nor `limit` is present, returns `paginating: false`
 *   (caller should return the full list — backward compatible).
 * - `limit` is clamped to [1, 200].
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');
  const paginating = pageParam !== null || limitParam !== null;
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(limitParam || '50', 10) || 50));
  return { page, limit, paginating };
}

export function getQueryParam(request: NextRequest, key: string): string {
  return new URL(request.url).searchParams.get(key)?.trim() || '';
}

// ---------------------------------------------------------------------------
// Success response with cache headers
// ---------------------------------------------------------------------------

const ONE_MINUTE = 60;
const FIVE_MINUTES = 300;

/** CDN-cached JSON response (s-maxage=60, swr=300). For public read-only data. */
export function cachedJson(data: unknown) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${ONE_MINUTE}, stale-while-revalidate=${FIVE_MINUTES}`,
    },
  });
}

/** No-store JSON response. For auth-gated or user-specific data. */
export function freshJson(data: unknown) {
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

// ---------------------------------------------------------------------------
// Paginated response shape
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function paginatedJson<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  return NextResponse.json<PaginatedResponse<T>>({
    data,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  });
}
