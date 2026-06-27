'use client';

/**
 * SmartImage — uses next/image when the src is from a host whitelisted in
 * next.config.ts (Cloudinary, Google, GitHub avatars), and falls back to a
 * plain <img> for any other host. This gets us the LCP / optimization wins
 * of next/image for the common cases (user avatars, OAuth avatars, uploaded
 * project images) without 500-ing on freeform admin-entered URLs.
 *
 * Uses width/height mode (not fill) so the parent container does NOT need
 * position: relative. Pass intrinsic dimensions via `width`/`height`; the
 * actual display size is controlled by `style` (typically width: 100%,
 * height: 100%, objectFit: cover).
 *
 * Usage:
 *   <SmartImage src={user.avatar} alt="avatar" width={200} height={200}
 *     style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
 */

import Image, { ImageProps } from 'next/image';

const ALLOWED_HOSTS = [
  'res.cloudinary.com',
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
];

function isAllowedHost(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('/') || src.startsWith('data:')) return true;
  try {
    const url = new URL(src);
    return ALLOWED_HOSTS.some(
      (h) => url.hostname === h || url.hostname.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
}

type SmartImageProps = {
  src: string | null | undefined;
  alt: string;
  /** Intrinsic dimensions for next/image. Defaults to 400x400. */
  width?: number;
  height?: number;
  /** Applied to both next/image and <img> fallback. */
  style?: React.CSSProperties;
  className?: string;
  /** Optional priority flag for above-the-fold images (LCP optimization). */
  priority?: boolean;
};

export function SmartImage({
  src,
  alt,
  width = 400,
  height = 400,
  style,
  className,
  priority,
}: SmartImageProps) {
  if (!src) return null;

  const mergedStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    ...style,
  };

  if (!isAllowedHost(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        style={mergedStyle}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={mergedStyle}
      quality={80}
      priority={priority}
      // Don't crash the whole page if a single image fails to load.
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

export default SmartImage;
