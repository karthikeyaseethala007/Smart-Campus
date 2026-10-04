import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { SplitText } from '../reactbits/SplitText';
import { BlurHighlight } from '../reactbits/BlurHighlight';

interface DarkTakeoverSectionProps {
  onEnterCommandCenter: () => void;
}

export const DarkTakeoverSection: React.FC<DarkTakeoverSectionProps> = ({ onEnterCommandCenter }) => {
  const capabilities = [
    'Monitor neural camera security streams in real time',
    'Investigate and resolve cryptographic incident logs',
    'Actuate perimeter gate solenoids & biometric permissions',
    'Balance campus power draw & automate HVAC zones',
    'Coordinate municipal and automated emergency response',
  ];

  return (
    <motion.section
      id="dark-takeover-section"
      initial={{ opacity: 0.96 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: 'relative',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        borderRadius: 'clamp(36px, 5vw, 64px) clamp(36px, 5vw, 64px) 0 0',
        marginTop: 'clamp(-48px, -6vh, -80px)',
        boxShadow: '0 -32px 80px rgba(0, 0, 0, 0.7)',
        padding: 'clamp(96px, 14vh, 180px) clamp(24px, 6vw, 96px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {/* Subtle Luminous Core Glow */}
      <BlurHighlight
        color="rgba(255, 130, 0, 0.12)"
        size="min(90vw, 800px)"
        blur={140}
        style={{ top: '35%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* STAGE 10: Emotional Climax Statement */}
        <div style={{ marginBottom: 'clamp(96px, 16vh, 180px)' }}>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#FF8200',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ width: '28px', height: '1px', backgroundColor: '#FF8200' }} />
            <span>THE AUTONOMIC MANDATE</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.8rem, 6.5vw, 6.8rem)',
              fontWeight: 450,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: '#FFFFFF',
              margin: '0 0 32px 0',
            }}
          >
            <SplitText text="FROM SIGNAL" delay={0.05} />
            <br />
            <span style={{ color: '#FF8200' }}>
              <SplitText text="TO ACTION." delay={0.2} />
            </span>
          </h2>

          <p
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(1.3rem, 2.2vw, 2.2rem)',
              fontWeight: 300,
              lineHeight: 1.4,
              color: '#8C9BA5',
              maxWidth: '820px',
              margin: 0,
            }}
          >
            EVERY SENSOR. EVERY CAMERA. EVERY ACCESS EVENT.{' '}
            <span style={{ color: '#FFFFFF', fontWeight: 450 }}>ONE CONNECTED RESPONSE.</span>
          </p>
        </div>

        {/* STAGE 11: Command Center Entry Climax */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            paddingTop: 'clamp(64px, 10vh, 120px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(48px, 6vw, 96px)',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                letterSpacing: '0.18em',
                color: '#7C8A96',
                marginBottom: '16px',
              }}
            >
              OPERATIONAL HUB · PRODUCTION ENVIRONMENT
            </div>

            <h3
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: 'clamp(2.2rem, 4.2vw, 4rem)',
                fontWeight: 450,
                letterSpacing: '-0.035em',
                lineHeight: 1.08,
                margin: '0 0 24px 0',
                color: '#FFFFFF',
              }}
            >
              The Campus
              <br />
              Command Center.
            </h3>

            <p
              style={{
                fontSize: '1.05rem',
                color: '#ADC2D6',
                lineHeight: 1.6,
                maxWidth: '480px',
                marginBottom: '40px',
              }}
            >
              Enter the functional operator dashboard to monitor live telemetry, investigate incidents, manage physical access, and oversee campus energy.
            </p>

            <motion.button
              whileHover={{ scale: 1.025, backgroundColor: '#FF8200' }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnterCommandCenter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 36px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                color: '#101820',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.813rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(255, 130, 0, 0.25)',
                transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <span>ENTER COMMAND CENTER</span>
              <ArrowUpRight size={16} />
            </motion.button>
          </div>

          {/* Core Product Capabilities List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              paddingTop: '12px',
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                letterSpacing: '0.14em',
                color: '#FF8200',
                marginBottom: '8px',
              }}
            >
              OPERATIONAL SCOPE
            </div>

            {capabilities.map((cap, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '18px',
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.75rem',
                    color: '#7C8A96',
                    marginTop: '2px',
                  }}
                >
                  0{i + 1}
                </span>
                <span
                  style={{
                    fontSize: '0.95rem',
                    color: '#ADC2D6',
                    lineHeight: 1.5,
                  }}
                >
                  {cap}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};
