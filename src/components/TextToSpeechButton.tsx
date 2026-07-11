'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TextToSpeechButton — plays/stops text narration using the browser's
 * built-in Web Speech API (speechSynthesis).
 *
 * No backend, no API calls, no cost. Voice quality depends on the
 * browser/OS (Chrome on Windows/Mac = great, some Linux = robotic).
 *
 * Features:
 * - Play/stop toggle
 * - Speed control (0.75x, 1x, 1.25x, 1.5x, 2x)
 * - Highlights while speaking (visual feedback)
 * - Auto-cleans up on unmount
 * - Graceful fallback if Web Speech API is not available
 */

interface TextToSpeechButtonProps {
  text: string;
  label?: string;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export default function TextToSpeechButton({ text, label = 'Listen' }: TextToSpeechButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isSupported, setIsSupported] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if Web Speech API is available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Split text into chunks — Web Speech API has issues with very long
   * texts (some browsers cut off after ~200 chars of actual speech).
   * Split on sentence boundaries, group into ~200-char chunks.
   */
  const splitIntoChunks = useCallback((fullText: string): string[] => {
    // Strip markdown for cleaner speech — remove code blocks, images,
    // links, formatting symbols. Keep the readable text only.
    const cleanText = fullText
      // Remove code blocks (```...```)
      .replace(/```[\s\S]*?```/g, ' [code block] ')
      // Remove inline code (`...`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove links [text](url) -> text
      .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove markdown headers (#, ##, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove horizontal rules
      .replace(/^---+$/gm, ' ')
      // Remove blockquote markers
      .replace(/^>\s+/gm, '')
      // Remove list markers (-, *, 1.)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Collapse whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return [];

    // Split into sentences, then group into ~200-char chunks
    const sentences = cleanText.match(/[^.!?]+[.!?]+\s*/g) || [cleanText];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length <= 200) {
        current += sentence;
      } else {
        if (current) chunks.push(current.trim());
        current = sentence;
      }
    }
    if (current) chunks.push(current.trim());

    return chunks.length > 0 ? chunks : [cleanText];
  }, []);

  const speak = useCallback(() => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) return;

    setTotalChunks(chunks.length);
    setCurrentChunk(0);
    setIsSpeaking(true);
    setIsPaused(false);

    // Speak each chunk sequentially
    let chunkIndex = 0;

    const speakNext = () => {
      if (chunkIndex >= chunks.length) {
        // All done
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentChunk(0);
        setTotalChunks(0);
        return;
      }

      setCurrentChunk(chunkIndex + 1);

      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utterance.rate = speed;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to pick a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
        voices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha')) ||
        voices.find(v => v.lang.startsWith('en') && v.name.includes('Daniel')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        chunkIndex++;
        speakNext();
      };

      utterance.onerror = (e) => {
        // If interrupted (cancelled), don't advance — just stop
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }
        console.error('TTS error:', e.error);
        chunkIndex++;
        speakNext();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  }, [isSupported, text, speed, splitIntoChunks]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentChunk(0);
    setTotalChunks(0);
  }, [isSupported]);

  const togglePause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking, isPaused]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    // If currently speaking, restart with new speed
    if (isSpeaking) {
      // Need to restart — Web Speech API doesn't support changing rate mid-utterance
      setTimeout(() => {
        window.speechSynthesis.cancel();
        // Small delay to let cancel propagate, then restart
        setTimeout(() => speak(), 100);
      }, 50);
    }
  }, [isSpeaking, speak]);

  // Don't render if not supported or no text
  if (!isSupported || !text.trim()) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 999,
      background: isSpeaking
        ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
        : 'color-mix(in srgb, var(--text-light) 5%, transparent)',
      border: isSpeaking
        ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)'
        : '1px solid var(--border-color)',
      fontSize: 12,
      fontWeight: 600,
      transition: 'all 0.2s',
    }}>
      {/* Play/Stop button */}
      <button
        onClick={isSpeaking ? stop : speak}
        style={{
          background: 'none',
          border: 'none',
          color: isSpeaking ? 'var(--accent)' : 'var(--text-dim)',
          cursor: 'pointer',
          fontSize: 13,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'inherit',
        }}
        title={isSpeaking ? 'Stop narration' : 'Listen to this module'}
      >
        <i className={`fa-solid ${isSpeaking ? 'fa-stop' : 'fa-volume-high'}`} />
        <span>{isSpeaking ? 'Stop' : label}</span>
      </button>

      {/* Pause/Resume button (only while speaking) */}
      {isSpeaking && (
        <button
          onClick={togglePause}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: 12,
            padding: 0,
            fontFamily: 'inherit',
          }}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}`} />
        </button>
      )}

      {/* Progress indicator (chunk X of Y) */}
      {isSpeaking && totalChunks > 1 && (
        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 500 }}>
          {currentChunk}/{totalChunks}
        </span>
      )}

      {/* Speed control (always visible when speaking, cycle on click) */}
      {isSpeaking && (
        <button
          onClick={() => {
            const currentIdx = SPEED_OPTIONS.indexOf(speed);
            const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
            handleSpeedChange(SPEED_OPTIONS[nextIdx]);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: 'inherit',
            fontWeight: 700,
            minWidth: 32,
          }}
          title="Click to cycle speed"
        >
          {speed}x
        </button>
      )}
    </div>
  );
}
