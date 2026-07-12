import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import type { Metadata } from 'next';

/**
 * Banned page — shows a plain "you've been banned" message.
 *
 * This page runs WITHIN the root layout (which provides <html>/<body>),
 * but overrides all visual styling to create a fully isolated look:
 * - Fixed full-screen overlay (covers all site components behind it)
 * - zIndex 999999 (above navbar, modals, everything)
 * - Solid black background (hides GrainBackground, etc.)
 * - No navbar/footer/modals visible
 *
 * The user sees ONLY the ban message — nothing else from the site
 * is visible or interactive.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Access Denied — XFoundry',
  robots: { index: false, follow: false },
};

export default async function BannedPage({ searchParams }: { searchParams: Promise<{ ip?: string; email?: string; reason?: string }> }) {
  const params = await searchParams;
  const ip = params.ip || '';
  const email = params.email || '';
  const redirectReason = params.reason || '';

  // Look up ban records
  let ipBan: { reason: string | null; createdAt: Date } | null = null;
  let emailBan: { reason: string | null; createdAt: Date } | null = null;

  try {
    if (ip) {
      ipBan = await db.bannedIp.findUnique({ where: { ip }, select: { reason: true, createdAt: true } });
    }
    if (email) {
      emailBan = await db.bannedEmail.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { reason: true, createdAt: true },
      });
    }
  } catch {
    // DB might be down — still show the banned page
  }

  const banReasons: string[] = [];
  if (redirectReason) banReasons.push(redirectReason);
  if (ipBan?.reason && !banReasons.includes(ipBan.reason)) banReasons.push(ipBan.reason);
  if (emailBan?.reason && !banReasons.includes(emailBan.reason)) banReasons.push(emailBan.reason);
  const hasReasons = banReasons.length > 0;

  return (
    <>
      {/* CSS to hide ALL site components (navbar, footer, modals, etc.) */}
      <style>{`
        /* Hide everything from the site behind this page */
        .navbar, .v-footer, .xf-loader, [class*="modal"], [class*="overlay"],
        .grain-background, .click-splash, .cookie-consent-banner,
        .xf-toast-container, .skip-link, #navbar, nav, footer,
        .page-transition-enter > *:not(.banned-page-overlay) {
          display: none !important;
        }
        /* Reset body styles that come from the site */
        body.xf-body {
          background: #0a0a0a !important;
          overflow: hidden !important;
        }
      `}</style>

      {/* Full-screen overlay that covers everything */}
      <div
        className="banned-page-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          fontFamily: "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: '#e5e5e5',
          WebkitFontSmoothing: 'antialiased',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{
          maxWidth: 480,
          width: '100%',
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          {/* Ban icon */}
          <div style={{
            width: 88,
            height: 88,
            margin: '0 auto 32px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <i className="fa-solid fa-ban" style={{ fontSize: 36, color: '#ef4444' }} />
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 12px',
            letterSpacing: -0.5,
          }}>
            You&apos;ve Been Banned
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 15,
            color: '#a3a3a3',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}>
            You are no longer permitted to access this website.
            {ip && <><br /><span style={{ fontSize: 12, color: '#525252' }}>IP: <code style={{ fontFamily: 'monospace', color: '#737373' }}>{ip}</code></span></>}
            {email && <><br /><span style={{ fontSize: 12, color: '#525252' }}>Email: <code style={{ fontFamily: 'monospace', color: '#737373' }}>{email}</code></span></>}
          </p>

          {/* Ban reason(s) */}
          {hasReasons && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 12,
              padding: '16px 20px',
              margin: '0 0 24px',
              textAlign: 'left',
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: '#ef4444',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <i className="fa-solid fa-circle-info" /> Reason
              </div>
              {banReasons.map((reason, i) => (
                <p key={i} style={{
                  fontSize: 13,
                  color: '#d4d4d4',
                  margin: i > 0 ? '8px 0 0' : '0',
                  lineHeight: 1.5,
                }}>
                  {reason}
                </p>
              ))}
            </div>
          )}

          {/* Contact info */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 24,
            marginTop: 24,
          }}>
            <p style={{
              fontSize: 13,
              color: '#737373',
              margin: '0 0 8px',
            }}>
              Think this is a mistake?
            </p>
            <a
              href="mailto:xfoundationcom@gmail.com?subject=Ban%20Appeal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e5e5e5',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'inherit',
              }}
            >
              <i className="fa-solid fa-envelope" style={{ fontSize: 12 }} />
              Contact Support
            </a>
          </div>

          {/* Footer text */}
          <p style={{
            fontSize: 11,
            color: '#404040',
            margin: '32px 0 0',
          }}>
            XFoundry — Access Denied
          </p>
        </div>
      </div>
    </>
  );
}
