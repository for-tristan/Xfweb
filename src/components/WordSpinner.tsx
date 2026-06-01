'use client';

import React from 'react';

// ═══════════════════════════════════════════════════
// WORD SPINNER — Vertically cycling text loader
// Based on Uiverse.io by kennyotsu, adapted for
// XFoundry theme system
// ═══════════════════════════════════════════════════

interface WordSpinnerProps {
  /** Static label text before the spinner (e.g. "Loading") */
  label?: string;
  /** Words to cycle through */
  words?: string[];
  /** Animation duration in seconds for one full cycle */
  duration?: number;
  /** Full-screen centered overlay (for page transitions) */
  fullscreen?: boolean;
}

export function WordSpinner({
  label = 'Loading',
  words = ['experience', 'courses', 'projects', 'services'],
  duration = 4,
  fullscreen = true,
}: WordSpinnerProps) {
  return (
    <div
      className="xf-word-spinner-wrapper"
      style={fullscreen ? undefined : { position: 'relative', minHeight: 'auto' }}
    >
      <div className="xf-word-spinner">
        <span className="xf-word-spinner-label">{label}</span>
        <div className="xf-word-spinner-words">
          {words.map((word, i) => (
            <span key={i} className="xf-word-spinner-word">{word}</span>
          ))}
        </div>
      </div>

      <style>{`
        .xf-word-spinner-word {
          animation-duration: ${duration}s;
        }
        .xf-word-spinner-words {
          height: 1.15em;
        }
      `}</style>
    </div>
  );
}
