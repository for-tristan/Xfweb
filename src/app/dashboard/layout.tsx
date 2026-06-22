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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard — X Foundry',
    description: 'Your personal learning dashboard. Track course progress, recent test results, study streaks, and continue where you left off.',
  },
  robots: { index: false, follow: false }, // Auth-gated, no SEO value
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
