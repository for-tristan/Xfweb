import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting store (resets on server restart, but sufficient for basic protection)
// For production, consider using Redis or a database-backed store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Rate limit configurations by route pattern
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints — strict limits
  '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 10 },        // 10 attempts per 15 min
  '/api/auth/signup': { windowMs: 60 * 60 * 1000, maxRequests: 5 },        // 5 signups per hour
  '/api/auth/forgot-password': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 requests per hour
  '/api/auth/reset-password': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min
  // General API — moderate limits
  '/api/chat': { windowMs: 60 * 1000, maxRequests: 30 },                   // 30 messages per minute
  '/api/quotes': { windowMs: 60 * 60 * 1000, maxRequests: 10 },            // 10 quotes per hour
  // AI endpoints — strict limits (costs money per token)
  '/api/ai/chat': { windowMs: 60 * 1000, maxRequests: 15 },                // 15 AI messages per minute
  '/api/ai/upload': { windowMs: 60 * 1000, maxRequests: 10 },              // 10 uploads per minute
  // Game & friend spam prevention
  '/api/games/submit': { windowMs: 60 * 1000, maxRequests: 10 },           // 10 score submissions per minute
  '/api/friends': { windowMs: 60 * 1000, maxRequests: 10 },                // 10 friend actions per minute
  // Email abuse prevention
  '/api/auth/resend-verification': { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 resends per hour
};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find matching rate limit config
  let matchedConfig: RateLimitConfig | undefined;
  let matchedPath: string | undefined;

  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      matchedConfig = config;
      matchedPath = path;
      break;
    }
  }

  if (matchedConfig && matchedPath) {
    const ip = getClientIp(request);
    const key = `${ip}:${matchedPath}`;
    const result = checkRateLimit(key, matchedConfig);

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetTime),
          },
        }
      );
    }

    // Add rate limit headers to the response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/chat/:path*',
    '/api/quotes/:path*',
    '/api/ai/:path*',
    '/api/games/submit',
    '/api/friends/:path*',
  ],
};
