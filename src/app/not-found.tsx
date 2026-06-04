import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
      color: 'var(--text-light, #efefef)',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        background: '#111',
        border: '1px solid rgba(220, 20, 60, 0.2)',
        borderRadius: 16,
        padding: '48px 32px',
        maxWidth: 480,
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 72, fontWeight: 900, color: 'var(--primary-red)', margin: '0 0 8px' }}>
          404
        </h1>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text-light, #efefef)' }}>
          Page not found
        </h2>
        <p style={{ color: 'var(--text-dim, #999)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: 'var(--primary-red)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
