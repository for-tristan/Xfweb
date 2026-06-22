import { SkeletonHero, SkeletonCourseCard } from '@/components/SkeletonScreens';

export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
      <SkeletonHero />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        <SkeletonCourseCard />
        <SkeletonCourseCard />
        <SkeletonCourseCard />
        <SkeletonCourseCard />
        <SkeletonCourseCard />
        <SkeletonCourseCard />
      </div>
    </div>
  );
}
