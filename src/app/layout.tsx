import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ClientProviders from '@/components/ClientProviders';
import GrainBackground from '@/components/GrainBackground';
import ClickSplash from '@/components/ClickSplash';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import PageViewTracker from '@/components/PageViewTracker';
import DeviceFingerprintCollector from '@/components/DeviceFingerprintCollector';
import BanCheckPoller from '@/components/BanCheckPoller';
import { Analytics } from "@vercel/analytics/next";
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser, deleteAllUserSessions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'XFoundry',
  description: 'The best way to predict the future is to create it.',
  keywords: ['AI', 'machine learning', 'software development', 'tech education', 'web development', 'XFoundry'],
  authors: [{ name: 'Tristan Montaser' }],
  icons: {
    icon: [
      { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAE7klEQVR42u2XX4xdVRnF1/r2uef+mbnn/jm3Ck1r9aVBrYFaDAqJVm0iiUaNUZ9MfBAlPtREGcAoURLU6IvAi1ETTKRpQmJ8w5QEEKNQqxgN/kuMUlqiIAGhQ/9MQ2fm58PsW05nplN80PrASXbu3d/d91trf2ft76xjSegiXqGLfP3XCfhiE+D//RYU5yvblNnyqhg5xnn+Nx2sWuNV+ZpxVpekCdpqgC7l34v8vUnEklKeLzV2NwVYPA/g2bkbgR0RutyFji4v6rcsa0nSdod2RqGnWdKvl5e0kJNOyU6JbrO004WeBx1iZV1H0lZbS0iHxZoKTquFJZLEWx08miqei5q9qaSSeJuDX6SKhTThltRhVqIn05LoSJQSO2wejooXYsyno0VL4r0Ofhg9nvCAu91DEtHAPIeAJIo8Lpc56Ir5mPD5KJlIXCnxoPssxia+lDrMSAxkuhJvsTkYFfOuuc4r4NdHi6Me8hdX3OUeH1NBXIiA825aElfYHHLF8ZhwQyq5VOLtNj9zn8VYqcRAYqfNI1Fx3GOud4tS4rNR8oJrHnaf3Y6z+Vur8NYQmJJoZyK7bH7jitMx4cZUskXiapufZxLfSh0eTH0WXLPXLToSn4kW81HzqCuu9Mpt2uPEB11Q5PwbEpjep24eV9v80hXzUXNTKnmdxDU2D3iWEzHmmIfc4JKOxKcy+GMecI3NUOLWaPO8R9yTNZBeCQHncg1lRhK3R5vTHjMfY+ZSyVUW90efEx7zxQz+yWgxH2P+6Ip3OhhJfCM6vOgx+93jCgXFhTQwBS+yymckvhptznjCTzzDr9znnzHmYKo445pb3aYr8YkoOBZj/uwB787gX48OC6652z3qnDtdSAPTo9jNx+vmaLPoCQc8y2UWH7A56iEnPeI2t+lJfDwKnoohv3PFe2wmErdFh5dcc497XNIQtjYiMN15N4vwC9HmtGsOeJbtEtsk9kePEx7zTbeZkfhoFPw9hpzyiEdSxVVhvhJtlmMTP/YMm3Ou1lrxnUtguvPIi/e65KRr7svgmyX2RQ9c822v9IAPReIfMeRPHnB7tDnmMb9PQ56JMfd6lm2N03Qe8JcJRN79Tgd3ussxj7nffbbLvEbiB9FjyTV3eKULvt+Jwx7wL4+4Lgo2S9zikmMecyRG7LbpSczk3BckUOTPr7nDS1m1b5QZS3w3g3/HXWYlrnXiyRhyxAOe9pCHUsU7bLZkEi+65qep4jKb8j+pQJLYpeB9SsxKDCTujC5nXPN9d+nnhnIkRhzxkGsdzLlk0RMeShW7bC6V+LJLTnvCA2nAG2yKV6qBpkrfbPO96HLKNXe5R19it4PHPeQJD9njoCPRl7jRJQuuuS9V7LCpJW52yakc22qTGlVel8BUgB9xwY9ihsdc8axH3OEOQ4l3OfHXs+CJJNFrdMu5DHgg+rwpd8A5l8x7zL2pz1Z7vQfRWg3c5DZ/84B97vFhJ9pZmIfc5w8esEeJyD1iuqtOHnMuecYj9scMl+Sn5Odc8qSH7EszVLnSPvfov2xIQtJIUk/Ss5IWJJWSXitrk6zntKyn8rrFhqmI7IYKSa+X1ZV1WMs6mWNbZPVkPa5lHV/lis5xSM1J0XArSw2gyHPW8YLRsF7RiC9u4AHXeEKvY6m9galcz5Q22+t6sQ1N6auvZq++mv2vr38DZX4BmxUM+mEAAAAASUVORK5CYII=", type: "image/png" }
    ],
},
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://xfoundryy.vercel.app',
    siteName: 'XFoundry',
    title: 'XFoundry',
    description: 'The best way to predict the future is to create it.',
    images: [
      {
        url: 'https://xfoundryy.vercel.app/og.png?v=20260708',
        width: 1200,
        height: 630,
        alt: 'XFoundry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XFoundry',
    description: 'The best way to predict the future is to create it.',
    images: ['https://xfoundryy.vercel.app/og.png?v=20260708'],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // BAN CHECK: Check IP + device + email bans on every page load.
  // If banned, redirect to /banned immediately.
  //
  // This catches users who are ALREADY logged in when they get banned —
  // they're redirected to /banned on their next page load, not when they
  // try to log in again. Their session is also invalidated so they can't
  // access API routes either.
  //
  // Skip the check for the /banned route itself (avoids infinite redirect
  // loop) and for API routes (they handle bans individually at the route
  // level).
  const headerList = await headers();
  const pathname = headerList.get('x-invoke-path') ||
                   headerList.get('x-pathname') || '';
  const isBannedRoute = pathname === '/banned' || pathname.startsWith('/banned');
  const isApiRoute = pathname.startsWith('/api/');

  if (!isBannedRoute && !isApiRoute) {
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headerList.get('x-real-ip') || '';
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('xfoundry_device_id')?.value || '';

    // Get the logged-in user (if any) so we can check email ban.
    // getCurrentUser() is cached per request via React cache(), so this
    // doesn't add an extra DB hit if other server components also call it.
    const currentUser = await getCurrentUser().catch(() => null);

    // Check IP ban + device ban + email ban in parallel
    try {
      const [ipBan, deviceBan, emailBan] = await Promise.all([
        ip ? db.bannedIp.findUnique({ where: { ip } }).catch(e => { console.error('[layout] IP ban query error:', e.message); return null; }) : null,
        deviceId ? db.bannedDevice.findUnique({ where: { deviceId } }).catch(e => { console.error('[layout] Device ban query error:', e.message); return null; }) : null,
        currentUser?.email ? db.bannedEmail.findUnique({ where: { email: currentUser.email } }).catch(e => { console.error('[layout] Email ban query error:', e.message); return null; }) : null,
      ]);

      if (ipBan) {
        if (currentUser) await deleteAllUserSessions(currentUser.id).catch(() => {});
        redirect(`/banned?ip=${encodeURIComponent(ip)}${ipBan.reason ? `&reason=${encodeURIComponent(ipBan.reason)}` : ''}`);
      }
      if (deviceBan) {
        if (currentUser) await deleteAllUserSessions(currentUser.id).catch(() => {});
        redirect(`/banned?device=${encodeURIComponent(deviceId)}${deviceBan.reason ? `&reason=${encodeURIComponent(deviceBan.reason)}` : ''}`);
      }
      if (emailBan) {
        if (currentUser) await deleteAllUserSessions(currentUser.id).catch(() => {});
        redirect(`/banned?email=${encodeURIComponent(currentUser!.email)}${emailBan.reason ? `&reason=${encodeURIComponent(emailBan.reason)}` : ''}`);
      }
    } catch (e) {
      // If redirect threw, re-throw (redirect() throws internally)
      if (e && typeof e === 'object' && 'digest' in e && typeof e.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')) {
        throw e;
      }
      // DB down — fail open (don't block everyone)
    }
  }

  return (
    <html lang="en" suppressHydrationWarning className="scrollbar-hidden">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Orbitron:wght@400;500;600;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="xf-body">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <GrainBackground />
        <ClickSplash />
        <ClientProviders>
          <DeviceFingerprintCollector />
          <BanCheckPoller />
          <PageViewTracker />
          <main id="main-content">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <CookieConsentBanner />
          <Toaster />
        </ClientProviders>
        {/* Vercel Analytics — page-view + Web Vitals tracking.
            No consent needed for aggregated, anonymized analytics
            (no PII collected). Renders an invisible script tag. */}
        <Analytics />
      </body>
    </html>
  );
}
