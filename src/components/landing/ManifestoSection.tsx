import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SplitText } from '../reactbits/SplitText';
import { BlurHighlight } from '../reactbits/BlurHighlight';

export const ManifestoSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const statementY = useTransform(scrollYProgress, [0.05, 0.35], [40, 0]);
  const statementOpacity = useTransform(scrollYProgress, [0.05, 0.25, 0.88, 1.0], [0, 1, 1, 0.3]);

  const disciplines = [
    { label: 'CCTV', code: '01', desc: 'Neural vision telemetry across perimeter & common zones' },
    { label: 'ACCESS', code: '02', desc: 'Sub-second biometric & keypad gate actuation' },
    { label: 'SENSORS', code: '03', desc: 'Continuous environmental, PIR, gas & occupancy sampling' },
    { label: 'EMERGENCY', code: '04', desc: 'Autonomous lockdown, siren & facility dispatch' },
    { label: 'ENERGY', code: '05', desc: 'Active load-shedding and self-balancing grid controls' },
  ];

  return (
    <section
      ref={containerRef}
      id="manifesto-section"
      style={{
        position: 'relative',
        minHeight: 'auto',
        backgroundColor: '#FFFFFF',
        color: '#101820',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(100px, 14vh, 180px) clamp(24px, 6vw, 96px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Luminous Bloom */}
      <BlurHighlight
        color="rgba(255, 130, 0, 0.08)"
        size="min(80vw, 700px)"
        blur={120}
        style={{ top: '20%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Editorial Subtitle Indicator */}
        <motion.div
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: '0.688rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#7C8A96',
            marginBottom: 'clamp(24px, 4vh, 48px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ width: '28px', height: '1px', backgroundColor: '#FF8200' }} />
          <span>AUTONOMIC CAMPUS MANIFESTO</span>
        </motion.div>

        {/* Cinematic Display Statement */}
        <motion.div style={{ opacity: statementOpacity, y: statementY }}>
          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.8rem, 6.2vw, 6.5rem)',
              fontWeight: 450,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: '#101820',
              margin: '0 0 clamp(48px, 8vh, 96px) 0',
              maxWidth: '1100px',
            }}
          >
            <SplitText text="ONE CAMPUS." delay={0.05} />
            <br />
            <span style={{ color: '#5B6871' }}>
              <SplitText text="THOUSANDS OF SIGNALS." delay={0.2} />
            </span>
            <br />
            <span style={{ color: '#101820' }}>
              <SplitText text="ONE SYSTEM." delay={0.35} />
            </span>
          </h2>

          {/* Sequential Typographic Reveal — No generic cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'clamp(32px, 4vw, 56px)',
              borderTop: '1px solid rgba(16, 24, 32, 0.12)',
              paddingTop: 'clamp(32px, 5vh, 48px)',
            }}
          >
            {disciplines.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.23, 1, 0.32, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.625rem',
                    color: '#FF8200',
                    letterSpacing: '0.14em',
                  }}
                >
                  {item.code}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                    fontSize: 'clamp(1.4rem, 2vw, 1.8rem)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: '#101820',
                  }}
                >
                  {item.label}
                </div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#5B6871',
                    lineHeight: 1.5,
                    margin: 0,
                    fontWeight: 400,
                  }}
                >
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
