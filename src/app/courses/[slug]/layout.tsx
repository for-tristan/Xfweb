import type { Metadata } from 'next';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

/**
 * Generate per-course SEO metadata so each course page has a unique
 * title/description in Google search results and social share previews.
 *
 * Falls back to sensible defaults if the course isn't found.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  let course: { title: string; description: string; level: string; duration: string; price: string; icon: string } | null = null;
  try {
    course = await db.course.findUnique({
      where: { slug },
      select: { title: true, description: true, level: true, duration: true, price: true, icon: true },
    });
  } catch {
    // DB might not be ready during build — fall through to defaults.
  }

  const title = course
    ? `${course.title} — X Foundry`
    : 'Course — X Foundry';

  const description = course?.description
    ? `${course.description} (${course.level} · ${course.duration} · ${course.price})`
    : 'Learn modern software development with X Foundry. Structured curriculum, hands-on projects, and certification.';

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      siteName: 'XFoundry',
      url: `https://xfoundryy.vercel.app/courses/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    keywords: course
      ? [course.title, course.level, 'course', 'XFoundry', 'software development']
      : ['course', 'XFoundry', 'software development'],
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
