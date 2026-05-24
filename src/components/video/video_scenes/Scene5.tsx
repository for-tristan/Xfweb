'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "linear" }}
    >
      <motion.div
        animate={{ scale: [1, 1.005, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="flex flex-col items-center w-full h-full justify-center"
      >
        <motion.img 
          src="/logo.png" 
          alt="XFoundry Logo"
          className="w-[120px] h-[120px] object-contain mb-8"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          className="text-[56px] font-black text-white tracking-[0.2em] mb-4"
        >
          XFOUNDRY
        </motion.div>

        <motion.div 
          className="h-[1px] bg-[#FF0033] mb-8"
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: 80 } : { width: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          className="text-[18px] font-[300] text-white/50 max-w-md text-center"
        >coming very very. soon</motion.div>

       
      </motion.div>
    </motion.div>
  );
}
