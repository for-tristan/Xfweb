import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coding Games — XFoundry',
  description: 'Sharpen your programming skills with bite-sized coding challenges. Race against the clock, earn points, and climb the global leaderboard.',
  openGraph: {
    type: 'website',
    title: 'Coding Games — XFoundry',
    description: 'Sharpen your programming skills with bite-sized coding challenges. Race against the clock, earn points, and climb the global leaderboard.',
    siteName: 'XFoundry',
    url: 'https://xfoundryy.vercel.app/games',
    images: [
      {
        url: 'https://xfoundryy.vercel.app/og.png?v=20260707',
        width: 1200,
        height: 630,
        alt: 'Coding Games — XFoundry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coding Games — XFoundry',
    description: 'Sharpen your programming skills with bite-sized coding challenges. Race against the clock, earn points, and climb the global leaderboard.',
    images: ['https://xfoundryy.vercel.app/og.png?v=20260707'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
