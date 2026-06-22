import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="xf-error-page">
      <div className="xf-error-card">
        <div className="xf-error-glyph">404</div>
        <h1 className="xf-error-title">Page not found</h1>
        <p className="xf-error-text">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="xf-error-btn">
          Go home
        </Link>
      </div>
    </div>
  );
}
