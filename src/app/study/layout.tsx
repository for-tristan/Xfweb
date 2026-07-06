import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Sessions — XFoundry',
  description: 'Track your focused study sessions, build streaks, and climb the leaderboard. Timer-based deep work with weekly stats.',
  openGraph: {
    type: 'website',
    title: 'Study Sessions — XFoundry',
    description: 'Track your focused study sessions, build streaks, and climb the leaderboard. Timer-based deep work with weekly stats.',
    siteName: 'XFoundry',
    url: 'https://xfoundryy.vercel.app/study',
    images: [
      {
        url: 'https://xfoundryy.vercel.app/og.png',
        width: 1200,
        height: 630,
        alt: 'Study Sessions — XFoundry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Study Sessions — XFoundry',
    description: 'Track your focused study sessions, build streaks, and climb the leaderboard. Timer-based deep work with weekly stats.',
    images: ['https://xfoundryy.vercel.app/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
