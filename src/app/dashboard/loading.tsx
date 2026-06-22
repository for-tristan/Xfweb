import { SkeletonText, SkeletonCard, SkeletonButton } from '@/components/SkeletonScreens';

export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <SkeletonText width={280} height={36} style={{ borderRadius: 8, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
        <SkeletonCard height={220} />
        <SkeletonCard height={220} />
        <SkeletonCard height={220} />
        <SkeletonCard height={220} />
      </div>
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SkeletonText width="60%" height={20} />
        <SkeletonText width="100%" height={14} lines={4} gap={8} />
        <SkeletonButton width={140} height={40} />
      </div>
    </div>
  );
}
