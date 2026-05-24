'use client';

import { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { startAmbient, playTransitionHit, stopAmbient, setAmbientVolume } from '@/lib/audio';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { ScenePrograms } from './video_scenes/ScenePrograms';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS: Record<string, number> = {
  intro: 5000,
  services: 6000,
  programs: 6000,
  performance: 5000,
  outro: 6000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1,
  services: Scene2,
  programs: ScenePrograms,
  performance: Scene4,
  outro: Scene5,
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });
  const isFirst = useRef(true);

  // Start ambient on mount, stop on unmount
  useEffect(() => {
    startAmbient();
    return () => stopAmbient();
  }, []);

  // Fire transition hit + notify parent on scene change
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    playTransitionHit();
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  // Scroll-based audio fade
  const handleScroll = useCallback(() => {
    const hero = document.getElementById('home');
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const heroHeight = rect.height;

    // Calculate how much the hero has scrolled out of view
    // 0 = hero fully visible, 1 = hero fully scrolled past
    let progress = 0;
    if (rect.bottom <= 0) {
      progress = 1; // fully scrolled past
    } else if (rect.bottom < heroHeight) {
      progress = 1 - (rect.bottom / heroHeight);
    }

    setAmbientVolume(Math.min(1, Math.max(0, progress)));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="w-full h-full overflow-hidden relative">
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
