import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Radio, Eye, Shield, Zap, Cpu, Flame } from 'lucide-react';

interface SignalItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  reading: string;
  decisionRule: string;
  actionResult: string;
}

export const SystemFlow: React.FC = () => {
  const [selectedSignal, setSelectedSignal] = useState<string>('cctv');

  const signals: SignalItem[] = [
    {
      id: 'pir',
      name: 'PIR MOTION',
      category: 'Occupancy Vector',
      icon: <Radio size={14} />,
      reading: 'Zone 02 · Motion Verified · 01:24 PM',
      decisionRule: 'Corridor Occupancy Policy: Level 2',
      actionResult: 'Localized adaptive illumination & optical focus lock',
    },
    {
      id: 'mq2',
      name: 'MQ-2 GAS / SMOKE',
      category: 'Atmospheric Safety',
      icon: <Flame size={14} />,
      reading: 'Zone 04 · 38 PPM · Normal Baseline',
      decisionRule: 'Threshold Guard: Alert at > 150 PPM',
      actionResult: 'Damper isolation armed, air recirculator standby',
    },
    {
      id: 'cctv',
      name: 'CCTV SURVEILLANCE',
      category: 'Visual Intelligence',
      icon: <Eye size={14} />,
      reading: 'Zone 01 · 1080p Optical Feed · 60 FPS',
      decisionRule: 'Perimeter Boundary Intrusion Guard',
      actionResult: 'License verification & automated gate turnstile release',
    },
    {
      id: 'access',
      name: 'ACCESS CONTROL',
      category: 'Credential Ledger',
      icon: <Shield size={14} />,
      reading: 'Portal 03 · RFID Badge #40892 Verified',
      decisionRule: 'Role-Based Access: Engineering Faculty',
      actionResult: 'Magnetic latch release, audit log entry, entry telemetry',
    },
    {
      id: 'energy',
      name: 'ENERGY AUTOMATION',
      category: 'Power Telemetry',
      icon: <Zap size={14} />,
      reading: 'Zone 06 · 54.85 kW · Efficient Baseline',
      decisionRule: 'Smart Load Optimization Schedule',
      actionResult: 'Dynamic load shedding on inactive workstation relays',
    },
    {
      id: 'iot',
      name: 'IoT TELEMETRY',
      category: 'Sensor Mesh',
      icon: <Cpu size={14} />,
      reading: 'Zone 07 · 21.4°C / 44% RH · Stable',
      decisionRule: 'Environmental Integrity Matrix',
      actionResult: 'Precision cooling loop adjustment & tamper circuit verification',
    },
  ];

  const current = signals.find((s) => s.id === selectedSignal) || signals[2];

  const flowSteps = [
    {
      stage: '01',
      title: 'SIGNAL',
      detail: current.name,
      meta: current.reading,
    },
    {
      stage: '02',
      title: 'COMMAND CENTER',
      detail: 'Real-time Ingestion',
      meta: 'TLS 1.3 encrypted broker · < 5ms ingestion',
    },
    {
      stage: '03',
      title: 'DECISION',
      detail: 'Autonomous Rule Engine',
      meta: current.decisionRule,
    },
    {
      stage: '04',
      title: 'ACTION',
      detail: 'Coordinated Execution',
      meta: current.actionResult,
    },
  ];

  return (
    <section
      id="connected-campus"
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
            <span>CONNECTED CAMPUS · SYSTEM FLOW</span>
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
              margin: '0 0 20px 0',
            }}
          >
            <span style={{ fontWeight: 700 }}>Every signal</span>{' '}
            <span 
              style={{ 
                fontStyle: 'italic', 
                fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
                fontWeight: 400,
              }}
            >
              has a response.
            </span>
          </motion.h2>

          <p style={{ fontSize: 'clamp(1rem, 1.3vw, 1.2rem)', color: '#5B6871', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
            Raw sensory inputs are continuously evaluated by the campus decision mesh, triggering physical and digital actions across all sectors in milliseconds.
          </p>
        </div>

        {/* Minimal Floating Signal Selector Labels */}
        <div style={{ marginBottom: '48px' }}>
          <div 
            style={{ 
              fontSize: '0.688rem', 
              fontWeight: 700, 
              letterSpacing: '0.14em', 
              textTransform: 'uppercase', 
              color: '#8C8C8C', 
              marginBottom: '16px' 
            }}
          >
            SELECT CAMPUS SIGNAL STREAM:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {signals.map((sig) => {
              const isSelected = sig.id === selectedSignal;
              return (
                <button
                  key={sig.id}
                  onClick={() => setSelectedSignal(sig.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    backgroundColor: isSelected ? '#101820' : 'rgba(255, 255, 255, 0.8)',
                    color: isSelected ? '#FFFFFF' : '#5B6871',
                    border: isSelected ? '1px solid #101820' : '1px solid rgba(16, 24, 32, 0.1)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#FF8200';
                      e.currentTarget.style.color = '#101820';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.1)';
                      e.currentTarget.style.color = '#5B6871';
                    }
                  }}
                >
                  <span style={{ color: isSelected ? '#FF8200' : 'inherit' }}>{sig.icon}</span>
                  <span>{sig.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Editorial Flow Architecture */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            paddingTop: '20px',
          }}
        >
          {flowSteps.map((step, idx) => (
            <motion.div
              key={step.stage}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              style={{
                position: 'relative',
                padding: '28px 24px',
                borderLeft: '1px solid rgba(16, 24, 32, 0.12)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Step indicator */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '16px' 
                }}
              >
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    fontFamily: "var(--font-mono, monospace)", 
                    fontWeight: 700, 
                    color: '#FF8200', 
                    letterSpacing: '0.1em' 
                  }}
                >
                  PHASE {step.stage}
                </span>
                {idx < 3 && (
                  <ArrowRight size={14} style={{ color: 'rgba(16, 24, 32, 0.3)' }} />
                )}
              </div>

              {/* Title */}
              <div 
                style={{ 
                  fontSize: '0.813rem', 
                  fontWeight: 700, 
                  letterSpacing: '0.12em', 
                  textTransform: 'uppercase', 
                  color: '#101820', 
                  marginBottom: '8px' 
                }}
              >
                {step.title}
              </div>

              {/* Dynamic Detail */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.detail}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: '#101820',
                    lineHeight: 1.3,
                    marginBottom: '10px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {step.detail}
                </motion.div>
              </AnimatePresence>

              {/* Dynamic Sub-Meta */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.meta}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    fontSize: '0.813rem',
                    color: '#5B6871',
                    lineHeight: 1.5,
                  }}
                >
                  {step.meta}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SystemFlow;
