import type { Metadata } from 'next';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

/**
 * Generate per-service SEO metadata so each service page has a unique
 * title/description in Google search results and social share previews.
 *
 * Falls back to sensible defaults if the service isn't found.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  let service: { title: string; description: string } | null = null;
  try {
    service = await db.service.findUnique({
      where: { slug },
      select: { title: true, description: true },
    });
  } catch {
    // DB might not be ready during build — fall through to defaults.
  }

  const title = service
    ? `${service.title} — XFoundry`
    : 'Service — XFoundry';

  const description = service?.description
    ? service.description
    : 'Custom software development, AI integration, security auditing, and team training from XFoundry.';

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      siteName: 'XFoundry',
      url: `https://xfoundryy.vercel.app/services/${slug}`,
      images: [
        {
          url: 'https://xfoundryy.vercel.app/og.png',
          width: 1200,
          height: 630,
          alt: `${title} — XFoundry`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://xfoundryy.vercel.app/og.png'],
    },
    keywords: service
      ? [service.title, 'service', 'XFoundry', 'software development']
      : ['service', 'XFoundry', 'software development'],
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
