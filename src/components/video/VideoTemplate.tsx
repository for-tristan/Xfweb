'use client';

import { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { ScenePrograms } from './video_scenes/ScenePrograms';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS: Record<string, number> = {
  intro: 3000,
  services: 4000,
  programs: 4000,
  performance: 3000,
  outro: 4000,
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


  // Fire transition hit + notify parent on scene change
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);



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
