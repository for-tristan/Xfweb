import React from 'react';

// Force dynamic rendering for all pages under /courses/
// These pages use heavy client-side React hooks that can't be prerendered
export const dynamic = 'force-dynamic';

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}