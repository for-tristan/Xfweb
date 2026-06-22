import { SkeletonText, SkeletonCard, SkeletonButton } from '@/components/SkeletonScreens';

export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <SkeletonText width={240} height={36} style={{ borderRadius: 8, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        <SkeletonCard height={240} />
        <SkeletonCard height={240} />
        <SkeletonCard height={240} />
      </div>
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
        <SkeletonButton width={200} height={48} />
      </div>
    </div>
  );
}
