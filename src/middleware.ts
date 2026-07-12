import { NextRequest, NextResponse } from 'next/server';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  '/api/auth/signup': { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  '/api/auth/forgot-password': { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  '/api/auth/reset-password': { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  // CRITICAL: verify-email was previously missing from this map, allowing
  // brute-force of the 6-digit code (1M combinations) -> account takeover.
  // 5 attempts per 15 min per IP is tight enough to make brute-force
  // infeasible (avg 200K requests needed = 40+ years at this rate).
  '/api/auth/verify-email': { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  '/api/chat': { windowMs: 60 * 1000, maxRequests: 30 },
  '/api/quotes': { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  '/api/ai/chat': { windowMs: 60 * 1000, maxRequests: 15 },
  '/api/ai/upload': { windowMs: 60 * 1000, maxRequests: 10 },
  '/api/games/submit': { windowMs: 60 * 1000, maxRequests: 10 },
  '/api/games/questions': { windowMs: 60 * 1000, maxRequests: 10 },
  '/api/friends': { windowMs: 60 * 1000, maxRequests: 10 },
  '/api/auth/resend-verification': { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  // /api/log-error was previously unauthenticated + unthrottled — open to
  // log injection / log poisoning / disk-fill DoS.
  '/api/log-error': { windowMs: 60 * 1000, maxRequests: 10 },
  // /api/track-view is called on every page navigation. Allow up to 30/min
  // per IP (enough for active browsing, blocks log-flooding attacks).
  '/api/track-view': { windowMs: 60 * 1000, maxRequests: 30 },
  // /api/ban-check is polled every 10s by BanCheckPoller. Allow up to
  // 20/min per IP (normal usage is 6/min, blocks brute-force probing).
  '/api/ban-check': { windowMs: 60 * 1000, maxRequests: 20 },
};

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
    '/api/games/questions',
    '/api/friends/:path*',
    '/api/log-error',
    '/api/track-view',
    '/api/ban-check',
  ],
};
