import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

interface FinalCTAProps {
  onEnter?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onEnter }) => {
  const { startOperationsTransition } = usePageTransition();

  const handleEnter = () => {
    if (onEnter) {
      onEnter();
    } else {
      startOperationsTransition('overview');
    }
  };

  return (
    <section
      id="final-cta"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#FFFFFF',
        color: '#101820',
        padding: 'clamp(140px, 22vh, 240px) clamp(24px, 6vw, 96px)',
        overflow: 'hidden',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Soft Ambient Orange Glow behind typography */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(450px, 60vw, 850px)',
          height: 'clamp(450px, 60vw, 850px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 130, 0, 0.12) 0%, rgba(255, 130, 0, 0.03) 50%, transparent 75%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
          <span>AUTONOMOUS PERIMETER INTELLIGENCE</span>
        </motion.div>

        {/* Large Centered Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 35, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, delay: 0.1 }}
          style={{
            fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
            fontSize: 'clamp(3.4rem, 7.8vw, 7.6rem)',
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 1.02,
            color: '#101820',
            margin: '0 0 32px 0',
          }}
        >
          <span style={{ display: 'block', fontWeight: 700, letterSpacing: '-0.045em' }}>
            MAKE THE CAMPUS
          </span>
          <span 
            style={{ 
              display: 'block', 
              color: '#101820',
              fontStyle: 'italic',
              fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
              fontWeight: 400,
              marginTop: '6px',
            }}
          >
            SMARTER.
          </span>
        </motion.h2>

        {/* Secondary Line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'clamp(12px, 2.5vw, 32px)',
            fontSize: 'clamp(1rem, 1.4vw, 1.35rem)',
            color: '#5B6871',
            fontWeight: 400,
            marginBottom: '52px',
          }}
        >
          <span>Protect people.</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>Detect threats.</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>Respond faster.</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>Automate intelligently.</span>
        </motion.div>

        {/* Primary CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={handleEnter}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 36px',
              borderRadius: '9999px',
              backgroundColor: '#101820',
              color: '#FFFFFF',
              fontSize: '0.813rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: '1px solid #101820',
              cursor: 'pointer',
              boxShadow: '0 12px 32px -4px rgba(16, 24, 32, 0.2)',
              transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8200';
              e.currentTarget.style.borderColor = '#FF8200';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 36px -4px rgba(255, 130, 0, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#101820';
              e.currentTarget.style.borderColor = '#101820';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(16, 24, 32, 0.2)';
            }}
          >
            <span>ENTER SMART CAMPUS</span>
            <ArrowUpRight size={16} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
