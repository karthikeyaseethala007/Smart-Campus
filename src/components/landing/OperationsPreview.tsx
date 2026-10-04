import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame } from 'lucide-react';

export const OperationsPreview: React.FC = () => {
  const [criticalTest, setCriticalTest] = useState(false);

  const metrics = [
    {
      num: '02',
      label: 'Critical Incidents',
      meta: 'Dispatched · Autonomous lockdown standby',
      highlight: true,
    },
    {
      num: '48',
      label: 'Connected Devices',
      meta: 'PIR, MQ-2, badge readers, optical domes',
      highlight: false,
    },
    {
      num: '17',
      label: 'Active Cameras',
      meta: 'Low-latency encrypted streams',
      highlight: false,
    },
    {
      num: '54.85 kW',
      label: 'Current Energy Load',
      meta: 'Adaptive baseline · 18% savings today',
      highlight: false,
    },
  ];

  return (
    <section
      id="live-operations"
      style={{
        position: 'relative',
        zIndex: 2,
        padding: 'clamp(100px, 16vh, 180px) clamp(24px, 6vw, 96px)',
        borderTop: '1px solid rgba(16, 24, 32, 0.08)',
        backgroundColor: 'transparent',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ maxWidth: '820px', marginBottom: '64px' }}>
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
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: '#FF8200',
              marginBottom: '20px',
            }}
          >
            <span>06 · LIVE OPERATIONS</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
              fontSize: 'clamp(2.6rem, 5.2vw, 4.6rem)',
              fontWeight: 300,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              color: '#101820',
              margin: '0 0 16px 0',
            }}
          >
            <span style={{ fontWeight: 700 }}>A continuous</span>{' '}
            <span 
              style={{ 
                fontStyle: 'italic', 
                fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
                fontWeight: 400,
              }}
            >
              operational pulse.
            </span>
          </motion.h2>

          <p style={{ fontSize: 'clamp(1rem, 1.3vw, 1.2rem)', color: '#5B6871', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
            Unified real-time metrics synthesized across 24 zones. Zero noise through automated correlation.
          </p>
        </div>

        {/* Large Typographic Editorial Metrics Grid with Thin Hairline Separators */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            borderTop: '1px solid rgba(16, 24, 32, 0.12)',
            borderBottom: '1px solid rgba(16, 24, 32, 0.12)',
            marginBottom: '48px',
          }}
        >
          {metrics.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              style={{
                padding: 'clamp(32px, 5vw, 48px) clamp(20px, 3vw, 32px)',
                borderRight: (idx % 2 === 0 || idx < 3) ? '1px solid rgba(16, 24, 32, 0.08)' : 'none',
                position: 'relative',
              }}
            >
              {/* Massive Numeral */}
              <div
                style={{
                  fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
                  fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: item.highlight ? '#FF8200' : '#101820',
                  marginBottom: '12px',
                }}
              >
                {item.num}
              </div>

              {/* Label */}
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#101820',
                  marginBottom: '6px',
                }}
              >
                {item.label}
              </div>

              {/* Meta */}
              <div
                style={{
                  fontSize: '0.813rem',
                  color: '#5B6871',
                  lineHeight: 1.5,
                }}
              >
                {item.meta}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ambient Gas / Smoke Telemetry Interactive Showcase (Editorial Strip) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            padding: '24px 32px',
            border: '1px solid rgba(16, 24, 32, 0.08)',
            borderRadius: '16px',
            backgroundColor: criticalTest ? 'rgba(255, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.6)',
            transition: 'background-color 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flame size={18} style={{ color: criticalTest ? '#FF0000' : '#FF8200' }} />
              <span style={{ fontSize: '0.813rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#101820' }}>
                MQ-2 SENSOR TELEMETRY:
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span 
                style={{ 
                  fontFamily: 'var(--font-mono, monospace)', 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: criticalTest ? '#FF0000' : '#101820' 
                }}
              >
                {criticalTest ? '380 PPM' : '42 PPM'}
              </span>
              <span 
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  letterSpacing: '0.08em', 
                  padding: '3px 8px', 
                  borderRadius: '4px',
                  backgroundColor: criticalTest ? 'rgba(255, 0, 0, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: criticalTest ? '#FF0000' : '#22c55e',
                  textTransform: 'uppercase',
                }}
              >
                {criticalTest ? 'CRITICAL SMOKE THRESHOLD' : 'NORMAL AMBIENCE'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCriticalTest(!criticalTest)}
            style={{
              background: 'none',
              border: '1px solid rgba(16, 24, 32, 0.15)',
              borderRadius: '9999px',
              padding: '8px 18px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: criticalTest ? '#FF0000' : '#101820',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FF8200';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.15)';
            }}
          >
            <Activity size={13} />
            <span>{criticalTest ? 'RESET SENSOR' : 'SIMULATE CRITICAL ALERT'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default OperationsPreview;
