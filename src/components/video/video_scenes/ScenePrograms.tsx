'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const PROGRAMS = [
  { label: 'Bootcamps', desc: 'Intensive hands-on training' },
  { label: 'Workshops', desc: 'Specialized skill development' },
  { label: 'Certifications', desc: 'Industry-recognized credentials' },
];

export function ScenePrograms() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 1700),
      setTimeout(() => setPhase(5), 2200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 sm:px-12"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
    >
      {/* Sub-label */}
      <motion.div
        className="mb-8"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-dim)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      >
        TECH EDUCATION
      </motion.div>

      {/* Heading 1 */}
      <div className="overflow-hidden mb-3">
        <motion.h2
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-light)', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}
          initial={{ y: '100%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          Learn. Grow.
        </motion.h2>
      </div>

      {/* Heading 2 */}
      <div className="overflow-hidden mb-24">
        <motion.h2
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-dim)', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.1 }}
          initial={{ y: '100%' }}
          animate={phase >= 3 ? { y: 0 } : { y: '100%' }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          Lead the industry.
        </motion.h2>
      </div>

      {/* Program list */}
      <div className="flex flex-col gap-7 max-w-lg w-full">
        {PROGRAMS.map((program, i) => (
          <motion.div
            key={program.label}
            className="flex items-center gap-6"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 4 + Math.min(i, 1) ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="w-8 h-[2px] shrink-0 rounded-full" style={{ background: 'var(--primary-red)' }} />
            <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span style={{ color: 'var(--text-light)', fontSize: 18, fontWeight: 700, letterSpacing: '0.02em', marginRight: 14 }}>
                {program.label}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 15, fontWeight: 300 }}>
                {program.desc}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
