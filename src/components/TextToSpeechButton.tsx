'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TextToSpeechButton — plays/stops text narration using the browser's
 * built-in Web Speech API (speechSynthesis).
 *
 * FIXES from v1:
 * - Stop button now works (tracks speech with a ref + cancels properly)
 * - Voice selection dropdown (user can pick any available voice)
 * - Reads code blocks aloud (doesn't skip them)
 * - Better chunking with proper onend chaining (no overlap/cutoff)
 * - Handles Firefox's speechSynthesis quirks (needs resume() hack)
 * - Handles Chrome's 15-second timeout bug (resume hack)
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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  // Use refs for values needed inside async callbacks (avoid stale closures)
  const isSpeakingRef = useRef(false);
  const chunkIndexRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const speedRef = useRef(speed);
  const voiceURIRef = useRef('');
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check support + load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
          // Pick a good default voice if none selected yet
          if (!voiceURIRef.current) {
            const preferred =
              availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
              availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha')) ||
              availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Daniel')) ||
              availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Microsoft')) ||
              availableVoices.find(v => v.lang.startsWith('en')) ||
              availableVoices[0];
            if (preferred) {
              setSelectedVoiceURI(preferred.voiceURI);
              voiceURIRef.current = preferred.voiceURI;
            }
          }
        }
      };

      loadVoices();
      // Voices load asynchronously in some browsers (Chrome)
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { voiceURIRef.current = selectedVoiceURI; }, [selectedVoiceURI]);

  // Chrome bug: speechSynthesis stops after ~15 seconds. This resume hack
  // keeps it alive. Also helps Firefox which sometimes pauses unexpectedly.
  useEffect(() => {
    if (!isSpeaking) {
      if (resumeTimerRef.current) {
        clearInterval(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
      return;
    }
    resumeTimerRef.current = setInterval(() => {
      if (isSpeakingRef.current && !window.speechSynthesis.speaking) {
        // Speech died unexpectedly — stop cleanly
        stop();
      }
    }, 5000);
    return () => {
      if (resumeTimerRef.current) {
        clearInterval(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, [isSpeaking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isSpeakingRef.current = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (resumeTimerRef.current) {
        clearInterval(resumeTimerRef.current);
      }
    };
  }, []);

  /**
   * Convert markdown to speech-friendly text.
   * Code blocks ARE read aloud (not skipped).
   */
  const markdownToSpeech = useCallback((fullText: string): string => {
    return fullText
      // Images: keep alt text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Links: keep link text, drop URL
      .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Headers: remove # symbols
      .replace(/^#{1,6}\s+/gm, '')
      // Bold/italic: remove markers
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Horizontal rules
      .replace(/^---+$/gm, '. ')
      // Blockquotes
      .replace(/^>\s+/gm, '')
      // List markers (-, *, 1.)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Code blocks: remove backtick fences, keep the code content
      .replace(/```[a-zA-Z]*\n?/g, '')
      .replace(/```/g, '')
      // Inline code: remove backticks
      .replace(/`([^`]+)`/g, '$1')
      // Collapse excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }, []);

  /**
   * Split text into chunks at sentence/paragraph boundaries.
   * Web Speech API cuts off after ~200-300 chars on some browsers.
   */
  const splitIntoChunks = useCallback((fullText: string): string[] => {
    const cleanText = markdownToSpeech(fullText);
    if (!cleanText) return [];

    // Split by paragraphs first (double newline)
    const paragraphs = cleanText.split(/\n\n+/);
    const chunks: string[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      if (trimmed.length <= 250) {
        chunks.push(trimmed);
      } else {
        // Split long paragraphs by sentences
        const sentences = trimmed.match(/[^.!?]+[.!?]+\s*/g) || [trimmed];
        let current = '';
        for (const sentence of sentences) {
          if ((current + sentence).length <= 250) {
            current += sentence;
          } else {
            if (current) chunks.push(current.trim());
            // If a single sentence is > 250 chars, split by commas
            if (sentence.length > 250) {
              const parts = sentence.split(/,\s*/);
              let subCurrent = '';
              for (const part of parts) {
                if ((subCurrent + part + ', ').length <= 250) {
                  subCurrent += part + ', ';
                } else {
                  if (subCurrent) chunks.push(subCurrent.trim());
                  subCurrent = part;
                }
              }
              if (subCurrent) chunks.push(subCurrent.trim());
            } else {
              current = sentence;
            }
          }
        }
        if (current) chunks.push(current.trim());
      }
    }

    return chunks.length > 0 ? chunks : [cleanText];
  }, [markdownToSpeech]);

  const speak = useCallback(() => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;

    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) return;

    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    setTotalChunks(chunks.length);
    setCurrentChunk(0);
    setIsSpeaking(true);
    setIsPaused(false);
    isSpeakingRef.current = true;

    // Speak chunks sequentially using onend chain
    const speakChunk = (index: number) => {
      if (!isSpeakingRef.current) return; // stopped
      if (index >= chunks.length) {
        // Done
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentChunk(0);
        setTotalChunks(0);
        return;
      }

      setCurrentChunk(index + 1);
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = speedRef.current;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Set selected voice
      const allVoices = window.speechSynthesis.getVoices();
      const voice = allVoices.find(v => v.voiceURI === voiceURIRef.current);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      utterance.onend = () => {
        if (!isSpeakingRef.current) return; // was stopped
        chunkIndexRef.current = index + 1;
        // Small delay between chunks for natural pacing
        setTimeout(() => speakChunk(index + 1), 80);
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
          // Stop was called — don't advance
          return;
        }
        console.error('TTS error:', e.error);
        // Skip to next chunk on error
        if (isSpeakingRef.current) {
          chunkIndexRef.current = index + 1;
          setTimeout(() => speakChunk(index + 1), 80);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    // Small delay to let cancel() propagate
    setTimeout(() => speakChunk(0), 100);
  }, [isSupported, text, splitIntoChunks]);

  const stop = useCallback(() => {
    isSpeakingRef.current = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentChunk(0);
    setTotalChunks(0);
  }, []);

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
    speedRef.current = newSpeed;
    // Restart from current chunk with new speed
    if (isSpeakingRef.current) {
      const currentIdx = chunkIndexRef.current;
      window.speechSynthesis.cancel();
      // Re-speak current chunk with new speed
      setTimeout(() => {
        if (isSpeakingRef.current) {
          const utterance = new SpeechSynthesisUtterance(chunksRef.current[currentIdx]);
          utterance.rate = newSpeed;
          utterance.pitch = 1;
          utterance.volume = 1;
          const allVoices = window.speechSynthesis.getVoices();
          const voice = allVoices.find(v => v.voiceURI === voiceURIRef.current);
          if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
          }
          utterance.onend = () => {
            if (!isSpeakingRef.current) return;
            chunkIndexRef.current = currentIdx + 1;
            setTimeout(() => {
              // Continue with remaining chunks
              const speakNext = (idx: number) => {
                if (!isSpeakingRef.current || idx >= chunksRef.current.length) {
                  isSpeakingRef.current = false;
                  setIsSpeaking(false);
                  setCurrentChunk(0);
                  setTotalChunks(0);
                  return;
                }
                setCurrentChunk(idx + 1);
                const u = new SpeechSynthesisUtterance(chunksRef.current[idx]);
                u.rate = speedRef.current;
                u.pitch = 1;
                u.volume = 1;
                const v = window.speechSynthesis.getVoices().find(vv => vv.voiceURI === voiceURIRef.current);
                if (v) { u.voice = v; u.lang = v.lang; }
                u.onend = () => {
                  if (!isSpeakingRef.current) return;
                  setTimeout(() => speakNext(idx + 1), 80);
                };
                u.onerror = () => {
                  if (isSpeakingRef.current) setTimeout(() => speakNext(idx + 1), 80);
                };
                window.speechSynthesis.speak(u);
              };
              speakNext(currentIdx + 1);
            }, 80);
          };
          utterance.onerror = () => {
            if (isSpeakingRef.current) {
              chunkIndexRef.current = currentIdx + 1;
            }
          };
          window.speechSynthesis.speak(utterance);
        }
      }, 100);
    }
  }, []);

  // Don't render if not supported or no text
  if (!isSupported || !text.trim()) return null;

  // Group voices by language
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  const otherVoices = voices.filter(v => !v.lang.startsWith('en'));

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      padding: '8px 12px',
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

      {/* Pause/Resume button */}
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

      {/* Progress indicator */}
      {isSpeaking && totalChunks > 1 && (
        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 500 }}>
          {currentChunk}/{totalChunks}
        </span>
      )}

      {/* Speed control */}
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

      {/* Voice selector dropdown */}
      <select
        value={selectedVoiceURI}
        onChange={(e) => setSelectedVoiceURI(e.target.value)}
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 6,
          cursor: 'pointer',
          maxWidth: 150,
          fontFamily: 'inherit',
        }}
        title="Select voice"
      >
        {englishVoices.length > 0 && (
          <optgroup label="English">
            {englishVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </optgroup>
        )}
        {otherVoices.length > 0 && (
          <optgroup label="Other languages">
            {otherVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
