import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface LandingIntroLoaderProps {
  onComplete: () => void;
}

export const LandingIntroLoader: React.FC<LandingIntroLoaderProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete();
      return;
    }

    const startTime = performance.now();
    const duration = 1200; // Fast ~1.2s preloader

    const update = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(p);
      if (p < 100) {
        requestAnimationFrame(update);
      } else {
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onComplete();
          }, 450);
        }, 180);
      }
    };

    requestAnimationFrame(update);
  }, [onComplete, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#000000',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'clamp(32px, 6vw, 64px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                letterSpacing: '0.14em',
                color: 'rgba(255, 255, 255, 0.45)',
                textTransform: 'uppercase',
              }}
            >
              INITIALIZING INTERFACE
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                letterSpacing: '0.1em',
                color: '#FF8200',
              }}
            >
              {progress}%
            </span>
          </div>

          {/* Center Brand & Core Discipline Statement */}
          <div style={{ textAlign: 'center' }}>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
                fontWeight: 500,
                letterSpacing: '-0.04em',
                margin: '0 0 16px 0',
                color: '#FFFFFF',
              }}
            >
              SMART CAMPUS
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: 'clamp(0.688rem, 1vw, 0.813rem)',
                letterSpacing: '0.22em',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              SECURITY / SAFETY / AUTOMATION
            </motion.p>
          </div>

          {/* Bottom Progress Bar */}
          <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)', position: 'relative' }}>
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${progress}%`,
                backgroundColor: '#FFFFFF',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
