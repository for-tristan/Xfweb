'use client';

import { useEffect, RefObject } from 'react';

/**
 * useOutsideClick — calls `onClick` when a pointer event lands outside `ref`.
 * React 19 compatible: `RefObject<T | null>` to match `useRef<T>(null)`.
 */
export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onClick: () => void,
) {
  useEffect(() => {
    function onMouseDown(event: MouseEvent | TouchEvent) {
      if (!ref.current) return;
      if (ref.current.contains(event.target as Node)) return;
      onClick();
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('touchstart', onMouseDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('touchstart', onMouseDown);
    };
  }, [ref, onClick]);
}
