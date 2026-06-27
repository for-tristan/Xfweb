import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coding Games — X Foundry',
  description: 'Sharpen your programming skills with bite-sized coding challenges. Race against the clock, earn points, and climb the global leaderboard.',
  openGraph: {
    type: 'website',
    title: 'Coding Games — X Foundry',
    description: 'Sharpen your programming skills with bite-sized coding challenges. Race against the clock, earn points, and climb the global leaderboard.',
    siteName: 'XFoundry',
    url: 'https://xfoundryy.vercel.app/games',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coding Games — X Foundry',
    description: 'Sharpen your programming skills with bite-sized coding challenges. Race against the clock, earn points, and climb the global leaderboard.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
