import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Terminal } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

interface CommandCenterCTAProps {
  onOpenCommandCenter?: () => void;
}

export const CommandCenterCTA: React.FC<CommandCenterCTAProps> = ({ onOpenCommandCenter }) => {
  const { startOperationsTransition } = usePageTransition();

  const handleOpen = () => {
    if (onOpenCommandCenter) {
      onOpenCommandCenter();
    } else {
      startOperationsTransition('overview');
    }
  };

  return (
    <section
      id="command-center-cta"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: 'clamp(120px, 20vh, 220px) clamp(24px, 6vw, 96px)',
        overflow: 'hidden',
      }}
    >
      {/* Soft Ambient Orange Light Beam behind dark composition */}
      <div 
        style={{
          position: 'absolute',
          top: '30%',
          right: '15%',
          width: 'clamp(400px, 50vw, 750px)',
          height: 'clamp(400px, 50vw, 750px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 130, 0, 0.15) 0%, rgba(255, 130, 0, 0.03) 50%, transparent 75%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
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
            marginBottom: '32px',
          }}
        >
          <Terminal size={14} />
          <span>07 · COMMAND CENTER SYSTEM</span>
        </motion.div>

        {/* Large Editorial Dark Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 35, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, delay: 0.1 }}
          style={{
            fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
            fontSize: 'clamp(3.2rem, 7.5vw, 7.4rem)',
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 1.02,
            color: '#FFFFFF',
            margin: '0 0 36px 0',
          }}
        >
          <span style={{ display: 'block', fontWeight: 700, letterSpacing: '-0.045em' }}>
            FROM SIGNAL
          </span>
          <span 
            style={{ 
              display: 'block', 
              color: '#FF8200',
              fontStyle: 'italic',
              fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
              fontWeight: 400,
              marginTop: '8px',
            }}
          >
            TO RESPONSE.
          </span>
        </motion.h2>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            maxWidth: '620px',
            fontSize: 'clamp(1.1rem, 1.6vw, 1.45rem)',
            color: 'rgba(255, 255, 255, 0.72)',
            lineHeight: 1.6,
            margin: '0 0 48px 0',
            fontWeight: 300,
          }}
        >
          One command center for security, safety, surveillance, automation and campus intelligence.
        </motion.p>

        {/* Primary CTA (Entering the System) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={handleOpen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 36px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              fontSize: '0.813rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 12px 32px -4px rgba(255, 255, 255, 0.25)',
              transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8200';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 36px -4px rgba(255, 130, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(255, 255, 255, 0.25)';
            }}
          >
            <span>OPEN COMMAND CENTER</span>
            <ArrowUpRight size={16} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default CommandCenterCTA;
