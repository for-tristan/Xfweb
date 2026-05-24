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
      className="absolute inset-0 flex flex-col justify-center pl-16 lg:pl-32 bg-black z-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.div
        className="text-[11px] text-white/50 tracking-[0.3em] font-light mb-5 uppercase"
        initial={{ opacity: 0, y: 8 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      >
        TECH EDUCATION
      </motion.div>

      <div className="overflow-hidden mb-3">
        <motion.h2
          className="text-white font-black leading-none"
          style={{ fontSize: 'clamp(52px, 6vw, 80px)' }}
          initial={{ y: '100%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          Learn. Grow.
        </motion.h2>
      </div>

      <div className="overflow-hidden mb-14">
        <motion.h2
          className="text-white/60 font-light italic leading-none"
          style={{ fontSize: 'clamp(52px, 6vw, 80px)' }}
          initial={{ y: '100%' }}
          animate={phase >= 3 ? { y: 0 } : { y: '100%' }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          Lead the industry.
        </motion.h2>
      </div>

      <div className="flex flex-col gap-5">
        {PROGRAMS.map((program, i) => (
          <motion.div
            key={program.label}
            className="flex items-center gap-6"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 4 + Math.min(i, 1) ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="w-6 h-[1px] bg-[#FF0033] shrink-0" />
            <div>
              <span className="text-white font-black text-[18px] tracking-wide mr-3">
                {program.label}
              </span>
              <span className="text-white/40 font-light text-[14px] tracking-wide">
                {program.desc}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
