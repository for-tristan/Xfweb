export default function Loading() {
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
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: '3px solid rgba(220, 20, 60, 0.2)',
        borderTop: '3px solid var(--primary-red)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ marginTop: 16, color: 'var(--text-dim, #999)', fontSize: 14 }}>Loading...</p>
    </div>
  );
}
