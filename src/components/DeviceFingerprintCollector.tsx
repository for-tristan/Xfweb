'use client';

import { useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * DeviceFingerprintCollector — runs once on page load, generates a
 * device fingerprint using FingerprintJS, and stores it in a cookie
 * so the server can read it for ban checks.
 *
 * The fingerprint is based on:
 * - Screen resolution, color depth
 * - Installed fonts
 * - WebGL renderer (GPU)
 * - Canvas fingerprint
 * - Audio fingerprint
 * - Timezone, language
 * - Hardware concurrency, device memory
 * - User-agent, platform
 *
 * ~90% of devices get a unique fingerprint. Incognito mode and VPN
 * don't change it. Switching browsers (Chrome → Firefox) does.
 */

const COOKIE_NAME = 'xfoundry_device_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export default function DeviceFingerprintCollector() {
  useEffect(() => {
    async function generateFingerprint() {
      try {
        // Check if we already have a deviceId cookie
        const existing = document.cookie
          .split('; ')
          .find(c => c.startsWith(`${COOKIE_NAME}=`));
        if (existing) return; // Already have one

        // Generate fingerprint
        const fp = await FingerprintJS.load();
        const result = await fp.get();

        // Store in cookie (not httpOnly so client can read it too,
        // but it's just a hash — no PII)
        document.cookie = `${COOKIE_NAME}=${result.visitorId}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
      } catch {
        // FingerprintJS might fail in some environments — fail silently
      }
    }

    generateFingerprint();
  }, []);

  return null;
}
