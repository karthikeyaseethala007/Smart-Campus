import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const EditorialSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Soft atmospheric halo drifting behind the editorial typography
  const haloY = useTransform(scrollYProgress, [0, 1], ['-20%', '20%']);
  const haloScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.15, 0.9]);
  const haloOpacity = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [0.2, 0.85, 0.85, 0.2]);

  return (
    <section
      ref={sectionRef}
      id="editorial"
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(80px, 14vh, 160px) clamp(24px, 6vw, 96px)',
        zIndex: 2,
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {/* Dedicated Soft Orange Atmospheric Halo (MDX Rhythm) */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(420px, 55vw, 840px)',
          height: 'clamp(420px, 55vw, 840px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 130, 0, 0.16) 0%, rgba(255, 130, 0, 0.05) 45%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 1,
          y: haloY,
          scale: haloScale,
          opacity: haloOpacity,
        }}
      />

      <div 
        style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          width: '100%',
          position: 'relative', 
          zIndex: 2 
        }}
      >
        {/* Subtle Editorial Kicker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: '#FF8200',
            marginBottom: '32px',
          }}
        >
          <span>ONE CAMPUS · ONE CONNECTED RESPONSE</span>
        </motion.div>

        {/* Huge Editorial Copy occupying a large portion of the viewport */}
        <motion.div
          initial={{ opacity: 0, y: 35, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          style={{
            marginBottom: '48px',
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
              fontSize: 'clamp(3.4rem, 7.8vw, 7.8rem)',
              fontWeight: 300,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: '#101820',
              margin: 0,
            }}
          >
            <span style={{ display: 'block', fontWeight: 700, letterSpacing: '-0.045em' }}>
              Every signal
            </span>
            <span 
              style={{ 
                display: 'block', 
                color: '#101820',
                fontStyle: 'italic',
                fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
                fontWeight: 400,
                marginTop: '10px',
              }}
            >
              has a response.
            </span>
          </h2>
        </motion.div>

        {/* Supporting Editorial Copy with generous whitespace */}
        <motion.div
          initial={{ opacity: 0, y: 25, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
          style={{
            maxWidth: '680px',
            borderLeft: '2px solid #FF8200',
            paddingLeft: '24px',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(1.15rem, 1.8vw, 1.6rem)',
              lineHeight: 1.55,
              color: '#5B6871',
              margin: 0,
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            Signals from access control, surveillance, sensors, emergency systems and energy infrastructure converge into one coordinated decision layer.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default EditorialSection;
