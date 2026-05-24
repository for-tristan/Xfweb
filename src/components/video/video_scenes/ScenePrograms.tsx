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
      className="absolute inset-0 flex flex-col justify-center pl-8 lg:pl-16 z-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.div
        className="text-[11px] tracking-[0.3em] font-light mb-4 uppercase"
        style={{ color: 'var(--text-dim)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      >
        TECH EDUCATION
      </motion.div>

      <div className="overflow-hidden mb-2">
        <motion.h2
          className="font-black leading-none"
          style={{ color: 'var(--text-light)', fontSize: 'clamp(36px, 5vw, 64px)' }}
          initial={{ y: '100%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          Learn. Grow.
        </motion.h2>
      </div>

      <div className="overflow-hidden mb-10">
        <motion.h2
          className="font-light italic leading-none"
          style={{ color: 'var(--text-dim)', fontSize: 'clamp(36px, 5vw, 64px)' }}
          initial={{ y: '100%' }}
          animate={phase >= 3 ? { y: 0 } : { y: '100%' }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          Lead the industry.
        </motion.h2>
      </div>

      <div className="flex flex-col gap-4">
        {PROGRAMS.map((program, i) => (
          <motion.div
            key={program.label}
            className="flex items-center gap-5"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 4 + Math.min(i, 1) ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="w-5 h-[1px] shrink-0" style={{ background: 'var(--primary-red)' }} />
            <div>
              <span className="font-black text-[16px] tracking-wide mr-2" style={{ color: 'var(--text-light)' }}>
                {program.label}
              </span>
              <span className="font-light text-[13px] tracking-wide" style={{ color: 'var(--text-dim)' }}>
                {program.desc}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
