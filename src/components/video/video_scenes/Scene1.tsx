'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LogoIcon } from '../../LogoIcon';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "linear" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
        className="mb-10"
      >
        <LogoIcon className="w-[140px] h-[140px]" />
      </motion.div>

      <div className="h-14 overflow-hidden flex justify-center items-center">
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-light)', fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 900, letterSpacing: '0.15em' }}>
          {'XFOUNDRY'.split('').map((char, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block' }}
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.01, delay: phase >= 2 ? i * 0.04 : 0 }}
            >
              {char}
            </motion.span>
          ))}
        </h1>
      </div>
    </motion.div>
  );
}
