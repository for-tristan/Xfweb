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
    "Web development",
    "Ai and Machine Learning",
    "UI Design",
    "UX Design",
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center pl-16 lg:pl-32 bg-black z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ x: "-100%" }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.div
        className="mb-8"
        style={{ height: 2, background: 'rgba(255,255,255,0.2)' }}
        initial={{ width: 0 }}
        animate={phase >= 1 ? { width: "40%" } : { width: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      />

      <motion.div
        className="text-[11px] text-white/50 tracking-[0.3em] font-[300] mb-4 uppercase"
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      >
        CAPABILITIES
      </motion.div>

      <div className="overflow-hidden">
        <motion.h2
          className="text-white text-[72px] font-black leading-tight"
          initial={{ y: "100%" }}
          animate={phase >= 3 ? { y: 0 } : { y: "100%" }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          We build what
        </motion.h2>
      </div>

      <div className="overflow-hidden mb-12">
        <motion.h2
          className="text-white/70 text-[72px] font-[300] italic leading-tight"
          initial={{ y: "100%" }}
          animate={phase >= 4 ? { y: 0 } : { y: "100%" }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          You imagine.
        </motion.h2>
      </div>

      <div className="flex gap-4 flex-wrap">
        {pills.map((pill, i) => (
          <motion.div
            key={i}
            className="border border-white/20 text-white/60 text-[12px] font-[400] uppercase tracking-widest px-4 py-2 rounded-full"
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
