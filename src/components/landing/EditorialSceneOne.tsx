import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const EditorialSceneOne: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Scene transition transforms
  const textOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.1, 1, 1, 0.2]);
  const textScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 1.02]);
  const haloScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.1, 1.25]);
  const haloOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.1, 0.22, 0.22, 0.08]);

  return (
    <div
      ref={containerRef}
      id="editorial-scene-1"
      style={{
        position: 'relative',
        height: '180vh',
        backgroundColor: '#FCFCFD',
      }}
    >
      {/* Sticky 100vh Viewport Stage */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 6vh, 64px) clamp(24px, 6vw, 96px)',
          boxSizing: 'border-box',
        }}
      >
        {/* Large Circular Orange Atmospheric Halo in Center (Inspired by MDX Scene 2) */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(380px, 58vw, 860px)',
            aspectRatio: '1/1',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 130, 0, 0.22) 0%, rgba(255, 130, 0, 0.08) 45%, transparent 72%)',
            filter: 'blur(75px)',
            pointerEvents: 'none',
            scale: haloScale,
            opacity: haloOpacity,
          }}
        />

        {/* Centered Massive Editorial Typography */}
        <motion.div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '1100px',
            opacity: textOpacity,
            scale: textScale,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: '#FF8200',
              marginBottom: '28px',
            }}
          >
            <span>INTELLIGENT CAMPUS MESH</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
              fontSize: 'clamp(2.8rem, 6.5vw, 6.2rem)',
              fontWeight: 300,
              letterSpacing: '-0.04em',
              lineHeight: 1.04,
              color: '#101820',
              margin: '0 0 28px 0',
            }}
          >
            <span style={{ display: 'block', fontWeight: 700 }}>
              ONE CAMPUS.
            </span>
            <span style={{ display: 'block', fontWeight: 300, color: '#5B6871' }}>
              ONE CONNECTED RESPONSE.
            </span>
            <span
              style={{
                display: 'block',
                fontStyle: 'italic',
                fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
                fontWeight: 400,
                color: '#101820',
                marginTop: '10px',
              }}
            >
              Every signal has a response.
            </span>
          </h2>

          <p
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              fontSize: 'clamp(1rem, 1.3vw, 1.25rem)',
              color: '#5B6871',
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            Signals from access control, surveillance, sensors, emergency systems and energy infrastructure converge into one coordinated decision layer.
          </p>
        </motion.div>

        {/* Subtle Stage Indicators at Bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: '1px', height: '18px', backgroundColor: '#FF8200' }} />
          <div style={{ width: '1px', height: '10px', backgroundColor: 'rgba(16, 24, 32, 0.15)' }} />
          <div style={{ width: '1px', height: '10px', backgroundColor: 'rgba(16, 24, 32, 0.15)' }} />
        </div>
      </div>
    </div>
  );
};

export default EditorialSceneOne;
