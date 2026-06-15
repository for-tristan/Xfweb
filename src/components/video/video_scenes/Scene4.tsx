'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "linear" }}
    >
      <div className="relative">
        <div className="overflow-hidden">
          <motion.div
            initial={{ y: 40 }}
            animate={phase >= 1 ? { y: 0 } : { y: 40 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-light)', fontSize: 'clamp(80px, 12vw, 140px)', fontWeight: 900, lineHeight: 1, letterSpacing: '0.04em', paddingTop: 10, paddingBottom: 10 }}
          >
            BUILT
          </motion.div>
        </div>

        <motion.div
          className="absolute -bottom-3 left-0 h-[2px] rounded-full"
          style={{ background: 'var(--primary-red)' }}
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: "100%" } : { width: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>

      <div className="overflow-hidden" style={{ marginTop: 48 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-dim)', fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.25em' }}
        >
          FOR WHAT&apos;S NEXT.
        </motion.div>
      </div>
    </motion.div>
  );
}
