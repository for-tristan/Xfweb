'use client';

import { useEffect, useRef } from 'react';

/**
 * ClickSound — global click sound effect.
 *
 * Plays a deep tactile "thock" on every click using the Web Audio API.
 * No audio file needed — synthesized at click time.
 *
 * The sound is a sine wave that ramps from 120Hz down to 80Hz over 60ms
 * with a gain envelope (0.04 → 0.001). Deep and subtle.
 *
 * AudioContext is created lazily on the first click (browsers require
 * user gesture before audio can play).
 */

export default function ClickSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    function playClick() {
      try {
        if (!ctxRef.current) {
          const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctxRef.current = new AC();
        }
        const ctx = ctxRef.current;
        if (!ctx) return;

        // Deep click: 120Hz → 80Hz sine, 60ms duration
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } catch {
        // Ignored if audio blocked
      }
    }

    document.addEventListener('click', playClick, { passive: true, capture: true });
    return () => document.removeEventListener('click', playClick, { capture: true } as EventListenerOptions);
  }, []);

  return null;
}
