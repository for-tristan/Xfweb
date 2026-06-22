import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Study Sessions — X Foundry',
  description: 'Track your focused study sessions, build streaks, and climb the leaderboard. Timer-based deep work with weekly stats.',
  openGraph: {
    type: 'website',
    title: 'Study Sessions — X Foundry',
    description: 'Track your focused study sessions, build streaks, and climb the leaderboard. Timer-based deep work with weekly stats.',
    siteName: 'XFoundry',
    url: 'https://xfoundryy.vercel.app/study',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Study Sessions — X Foundry',
    description: 'Track your focused study sessions, build streaks, and climb the leaderboard. Timer-based deep work with weekly stats.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
