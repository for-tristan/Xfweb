'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1400),
      setTimeout(() => setPhase(5), 2200),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const pills = [
    "Software Development",
    "Web Development",
    "AI & Machine Learning",
    "UI Design",
    "UX Design",
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 sm:px-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ x: "-100%" }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
    >
      {/* Line draw */}
      <motion.div
        className="mb-10"
        style={{ height: 2, background: 'var(--primary-red)', opacity: 0.5 }}
        initial={{ width: 0 }}
        animate={phase >= 1 ? { width: "120px" } : { width: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      />

      {/* Sub-label */}
      <motion.div
        className="mb-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-dim)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      >
        CAPABILITIES
      </motion.div>

      {/* Heading 1 */}
      <div className="overflow-hidden mb-2">
        <motion.h2
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-light)', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}
          initial={{ y: "100%" }}
          animate={phase >= 3 ? { y: 0 } : { y: "100%" }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          We build what
        </motion.h2>
      </div>

      {/* Heading 2 */}
      <div className="overflow-hidden mb-24">
        <motion.h2
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-dim)', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.1 }}
          initial={{ y: "100%" }}
          animate={phase >= 4 ? { y: 0 } : { y: "100%" }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          You imagine.
        </motion.h2>
      </div>

      {/* Pills */}
      <div className="flex gap-4 flex-wrap justify-center max-w-xl">
        {pills.map((pill, i) => (
          <motion.div
            key={i}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--text-dim)', border: '1px solid var(--border-color)', borderRadius: 9999, padding: '8px 18px' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
            }
            transition={{
              duration: 0.6,
              delay: phase >= 5 ? i * 0.15 : 0,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            {pill}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
