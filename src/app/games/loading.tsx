import { SkeletonText, SkeletonCard, SkeletonButton } from '@/components/SkeletonScreens';

export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <SkeletonText width={260} height={36} style={{ borderRadius: 8, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        <SkeletonCard height={280} />
        <SkeletonCard height={280} />
        <SkeletonCard height={280} />
      </div>
      <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <SkeletonButton width={160} height={48} />
        <SkeletonButton width={120} height={48} />
      </div>
    </div>
  );
}
