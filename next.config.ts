import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // SECURITY: Do not ignore TypeScript errors — they should be caught and fixed
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable React Strict Mode to catch effect/closure bugs during development
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  // SECURITY: HTTP security headers for production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking — only allow same-origin framing
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Enable browser XSS filter
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Control referrer information sent to other sites
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restrict browser features (camera, mic, geolocation, etc.)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Content Security Policy — strict but allows our resources
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
              "connect-src 'self' https://vercel.live https://vitals.vercel-insights.com",
              "frame-src https://www.youtube.com https://youtube.com https://player.vimeo.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
          // HSTS — force HTTPS for 1 year (only in production with proper domain)
          // Uncomment after confirming HTTPS is working correctly:
          // {
          //   key: "Strict-Transport-Security",
          //   value: "max-age=31536000; includeSubDomains; preload",
          // },
        ],
      },
    ];
  },
};

export default nextConfig;
