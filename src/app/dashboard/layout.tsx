import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — X Foundry',
  description: 'Your personal learning dashboard. Track course progress, recent test results, study streaks, and continue where you left off.',
  openGraph: {
    type: 'website',
    title: 'Dashboard — X Foundry',
    description: 'Your personal learning dashboard. Track course progress, recent test results, study streaks, and continue where you left off.',
    siteName: 'XFoundry',
    url: 'https://xfoundryy.vercel.app/dashboard',
    images: [
      {
        url: 'https://xfoundryy.vercel.app/og.png',
        width: 1200,
        height: 630,
        alt: 'Dashboard — X Foundry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard — X Foundry',
    description: 'Your personal learning dashboard. Track course progress, recent test results, study streaks, and continue where you left off.',
    images: ['https://xfoundryy.vercel.app/og.png'],
  },
  robots: { index: false, follow: false }, // Auth-gated, no SEO value
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
