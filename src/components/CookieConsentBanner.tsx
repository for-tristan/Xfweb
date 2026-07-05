'use client';

import { useEffect, useState } from 'react';

/**
 * CookieConsentBanner — detects if cookies/storage are blocked and shows
 * a banner telling the user to enable them. If storage works, shows a
 * standard cookie consent banner once (stored in localStorage).
 */
export default function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    // Check if storage is blocked
    let blocked = false;
    try {
      localStorage.setItem('__xf_test', '1');
      localStorage.removeItem('__xf_test');
    } catch {
      blocked = true;
      setStorageBlocked(true);
      setShow(true);
      return;
    }

    // Storage works — check if user already consented
    try {
      const existing = localStorage.getItem('xfoundry_cookie_consent');
      if (!existing) {
        setConsent(null);
        setShow(true);
      } else {
        setConsent(existing as 'accepted' | 'declined');
      }
    } catch {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('xfoundry_cookie_consent', 'accepted');
    } catch {}
    setShow(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('xfoundry_cookie_consent', 'declined');
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  // Storage blocked — different banner
  if (storageBlocked) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99998,
          background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 280, display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 20, color: 'var(--warning-color)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', marginBottom: 2 }}>
              Cookies & site data are blocked
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>
              This site needs cookies to keep you logged in. Please enable <strong>On-device site data</strong> in your browser settings.
            </div>
          </div>
        </div>
        <a
          href="edge://settings/content/cookies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            textDecoration: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <i className="fa-solid fa-gear" style={{ fontSize: 11 }} />
          Open Settings
        </a>
        <button
          onClick={handleDecline}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            color: 'var(--text-dim)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Continue without
        </button>
      </div>
    );
  }

  // Standard cookie consent
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99998,
        background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)',
        backdropFilter: 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        borderTop: '1px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 280, display: 'flex', alignItems: 'center', gap: 12 }}>
        <i className="fa-solid fa-cookie-bite" style={{ fontSize: 20, color: 'var(--accent)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', marginBottom: 2 }}>
            We use cookies
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>
            XFoundry uses cookies to keep you logged in and provide a better experience. By continuing, you agree to our use of cookies.
          </div>
        </div>
      </div>
      <button
        onClick={handleAccept}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <i className="fa-solid fa-check" style={{ fontSize: 11 }} />
        Accept
      </button>
      <button
        onClick={handleDecline}
        style={{
          padding: '10px 16px',
          background: 'transparent',
          color: 'var(--text-dim)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Decline
      </button>
    </div>
  );
}
