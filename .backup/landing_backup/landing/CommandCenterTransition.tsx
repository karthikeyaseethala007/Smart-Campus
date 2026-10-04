import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Terminal } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

interface CommandCenterTransitionProps {
  onOpenCommandCenter?: () => void;
}

export const CommandCenterTransition: React.FC<CommandCenterTransitionProps> = ({ onOpenCommandCenter }) => {
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
      id="command-center-transition"
      style={{
        position: 'relative',
        zIndex: 3,
        backgroundColor: '#000000',
        color: '#FFFFFF',
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(64px, 12vh, 120px) clamp(24px, 6vw, 96px)',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Orange Beam Effect behind text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(750px, 90vw)',
          height: 'min(750px, 90vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 130, 0, 0.16) 0%, rgba(255, 130, 0, 0.04) 45%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '940px' }}>
        {/* Terminal Status Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.688rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: '#FF8200',
            marginBottom: '32px',
          }}
        >
          <Terminal size={13} />
          <span>PRODUCTION COMMAND CENTER · ACTIVE RUNTIME</span>
        </motion.div>

        {/* Huge Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{
            fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
            fontSize: 'clamp(3rem, 7.5vw, 6.8rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.02,
            margin: '0 0 24px 0',
            color: '#FFFFFF',
          }}
        >
          <span>FROM SIGNAL</span>
          <br />
          <span
            style={{
              fontStyle: 'italic',
              fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
              fontWeight: 400,
              color: '#FF8200',
            }}
          >
            TO RESPONSE.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontSize: 'clamp(1.05rem, 1.4vw, 1.35rem)',
            color: '#8C8C8C',
            maxWidth: '640px',
            margin: '0 auto 44px auto',
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          One command center for security, safety, surveillance, automation and campus intelligence.
        </motion.p>

        {/* Enter System Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
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
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 12px 32px -4px rgba(255, 130, 0, 0.4), 0 4px 16px rgba(255, 255, 255, 0.1)',
              transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8200';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.transform = 'translateY(0)';
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

export default CommandCenterTransition;
