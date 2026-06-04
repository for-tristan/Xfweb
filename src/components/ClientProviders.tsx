'use client';

import { useEffect } from 'react';
import LenisProvider from '@/components/LenisProvider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // Remove scroll-lock on mount (was only needed for preloader)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('scroll-locked');
  }, []);

  return (
    <LenisProvider>
      {children}
    </LenisProvider>
  );
}
