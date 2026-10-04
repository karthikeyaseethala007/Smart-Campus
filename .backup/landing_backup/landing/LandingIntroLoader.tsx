import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface LandingIntroLoaderProps {
  onComplete: () => void;
}

const MESSAGES = [
  'INITIALIZING CAMPUS',
  'CONNECTING SECURITY NETWORK',
  'SYNCING SENSOR GRID',
  'ESTABLISHING COMMAND CENTER',
  'SMART CAMPUS',
];

export const LandingIntroLoader: React.FC<LandingIntroLoaderProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete();
      return;
    }

    // Step through the 5 messages smoothly over ~2.4 seconds
    const intervalTime = 420;
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 100));
    }, 45);

    const messageInterval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < MESSAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(messageInterval);
          clearInterval(progressInterval);
          setProgress(100);
          // Allow final 'SMART CAMPUS' to rest briefly before cinematic exit
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
              onComplete();
            }, 650);
          }, 450);
          return prev;
        }
      });
    }, intervalTime);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="mdx-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: -30,
            filter: 'blur(10px)',
            transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: '#FCFCFD',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'clamp(24px, 5vh, 48px) clamp(24px, 5vw, 64px)',
            userSelect: 'none',
            fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
          }}
        >
          {/* Subtle Orange Atmospheric Glow in Center */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(500px, 80vw)',
              height: 'min(500px, 80vw)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 130, 0, 0.12) 0%, rgba(255, 130, 0, 0.03) 50%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Bar: Minimal Status & Skip */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FF8200',
                  boxShadow: '0 0 8px #FF8200',
                }}
              />
              <span
                style={{
                  fontSize: '0.688rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: '#5B6871',
                }}
              >
                AUTONOMOUS SYSTEM KERNEL
              </span>
            </div>

            <button
              onClick={() => {
                setIsExiting(true);
                setTimeout(onComplete, 200);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.688rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: '#8C8C8C',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#101820')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8C8C8C')}
            >
              SKIP INTRO ↗
            </button>
          </div>

          {/* Center Stage: Sequential Morphing Messages */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              zIndex: 2,
              minHeight: '120px',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={MESSAGES[currentIndex]}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize: currentIndex === MESSAGES.length - 1
                    ? 'clamp(2.4rem, 6vw, 4.5rem)'
                    : 'clamp(1rem, 2.2vw, 1.4rem)',
                  fontWeight: currentIndex === MESSAGES.length - 1 ? 700 : 500,
                  letterSpacing: currentIndex === MESSAGES.length - 1 ? '-0.03em' : '0.18em',
                  color: '#101820',
                  textTransform: 'uppercase',
                }}
              >
                {MESSAGES[currentIndex]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Bar: Minimal Linear Progress Line & Percentage */}
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '1px',
                backgroundColor: 'rgba(16, 24, 32, 0.08)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: '#FF8200',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                fontSize: '0.625rem',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                color: '#8C8C8C',
                letterSpacing: '0.1em',
              }}
            >
              <span>TELEMETRY SYNC</span>
              <span>{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LandingIntroLoader;
