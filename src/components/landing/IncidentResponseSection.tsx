import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Search, AlertOctagon, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TiltedCard } from '../reactbits/TiltedCard';

interface WorkflowStep {
  id: string;
  stepNum: string;
  title: string;
  stageName: string;
  icon: React.ElementType;
  status: 'CRITICAL' | 'WARNING' | 'RESOLVED';
  headline: string;
  detail: string;
  telemetryLog: string;
}

const STEPS: WorkflowStep[] = [
  {
    id: 'signal',
    stepNum: '01',
    title: 'SIGNAL',
    stageName: 'RAW VOLATILE TELEMETRY',
    icon: Radio,
    status: 'WARNING',
    headline: 'MQ-2 Gas Sensor #4 registers 380 PPM in Science Lab 4',
    detail: 'Analog voltage spike detected across zone Bus-B. Sensor discriminator rules out thermal fluctuation.',
    telemetryLog: 'ADC VOLTAGE: 3.82V · PPM THRESHOLD EXCEEDED (+280 PPM ABOVE BASELINE)',
  },
  {
    id: 'detection',
    stepNum: '02',
    title: 'DETECTION',
    stageName: 'OPTICAL & SENSORY CORRELATION',
    icon: Search,
    status: 'CRITICAL',
    headline: 'Cam-04 Optical Neural Mesh detects smoke particulate bloom',
    detail: 'Vision model cross-references 30fps optical stream with PIR matrix. Zero occupants identified in danger perimeter.',
    telemetryLog: 'OPTICAL CONFIDENCE: 99.4% · OCCUPANCY COUNT: 0 PERSONS TRAPPED',
  },
  {
    id: 'incident',
    stepNum: '03',
    title: 'INCIDENT',
    stageName: 'SEVERITY CLASSIFICATION',
    icon: AlertOctagon,
    status: 'CRITICAL',
    headline: 'Incident #INC-892 Escalated to Class-A Hazard Event',
    detail: 'Autonomic engine creates cryptographic incident record and locks Zone D perimeter turnstiles.',
    telemetryLog: 'SEVERITY: CRITICAL-RED · ZONE ISOLATION TIME: 84ms',
  },
  {
    id: 'response',
    stepNum: '04',
    title: 'RESPONSE',
    stageName: 'AUTONOMOUS ACTUATOR DISPATCH',
    icon: ShieldAlert,
    status: 'CRITICAL',
    headline: 'Emergency Exhaust Actuated · Siren Dispatched',
    detail: 'Relays 3 & 7 energize positive-pressure exhaust dampers. Municipal fire dispatcher received coordinate payload.',
    telemetryLog: 'DAMPER EXHAUST CFM: 4,200 · SIREN BEACON ACTIVE',
  },
  {
    id: 'resolved',
    stepNum: '05',
    title: 'RESOLVED',
    stageName: 'SYSTEM NORMALIZATION',
    icon: CheckCircle2,
    status: 'RESOLVED',
    headline: 'Hazard Purged · Zone Restored to Secure Baseline',
    detail: 'PPM drops to 44 PPM. Solenoid interlocks unlock for safety inspector credentials. Incident archived.',
    telemetryLog: 'PPM RESTORED: 44 PPM · INCIDENT CLOSED IN 1m 42s',
  },
];

export const IncidentResponseSection: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(2); // Default on INCIDENT
  const currentStep = STEPS[activeStepIndex];

  return (
    <section
      id="incident-response-section"
      style={{
        position: 'relative',
        backgroundColor: '#0A0E13',
        color: '#FFFFFF',
        padding: 'clamp(80px, 12vh, 160px) clamp(24px, 6vw, 96px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Section Headline */}
        <div style={{ marginBottom: 'clamp(48px, 8vh, 80px)' }}>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#FF8200',
              marginBottom: '16px',
            }}
          >
            DETERMINISTIC ESCALATION · INCIDENT LIFECYCLE
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.4rem, 4.5vw, 4.2rem)',
              fontWeight: 450,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              margin: '0 0 16px 0',
              color: '#FFFFFF',
            }}
          >
            Cause to Response.
            <br />
            <span style={{ color: '#8C9BA5', fontWeight: 400 }}>Within Milliseconds.</span>
          </h2>

          <p style={{ fontSize: '1rem', color: '#8C9BA5', maxWidth: '640px', lineHeight: 1.6, margin: 0 }}>
            Inspect the autonomous reaction chain below. Every incident progresses through deterministic stages from initial raw voltage fluctuation to physical resolution.
          </p>
        </div>

        {/* Horizontal Step Progression Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
            marginBottom: 'clamp(32px, 5vh, 48px)',
            overflowX: 'auto',
            paddingBottom: '8px',
          }}
        >
          {STEPS.map((s, idx) => {
            const isSelected = activeStepIndex === idx;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStepIndex(idx)}
                style={{
                  padding: '16px 14px',
                  borderRadius: '16px',
                  backgroundColor: isSelected ? 'rgba(255, 130, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected ? '#FF8200' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: isSelected ? '#FFFFFF' : '#8C9BA5',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  minWidth: '160px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.625rem',
                      color: isSelected ? '#FF8200' : '#637381',
                    }}
                  >
                    STAGE {s.stepNum}
                  </span>
                  <Icon size={16} color={isSelected ? '#FF8200' : '#8C9BA5'} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                    fontSize: '1rem',
                    fontWeight: 500,
                  }}
                >
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Cinematic Stage Panel */}
        <TiltedCard
          maxAngle={5}
          style={{
            backgroundColor: '#111720',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: 'clamp(36px, 5vw, 64px)',
            boxShadow: '0 24px 60px -16px rgba(0, 0, 0, 0.6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Status Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.688rem',
                      letterSpacing: '0.14em',
                      color: '#FF8200',
                    }}
                  >
                    PHASE {currentStep.stepNum} · {currentStep.stageName}
                  </span>
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.688rem',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor:
                      currentStep.status === 'CRITICAL'
                        ? 'rgba(255, 0, 0, 0.15)'
                        : currentStep.status === 'WARNING'
                        ? 'rgba(255, 130, 0, 0.15)'
                        : 'rgba(34, 197, 94, 0.15)',
                    color:
                      currentStep.status === 'CRITICAL'
                        ? '#FF4444'
                        : currentStep.status === 'WARNING'
                        ? '#FF8200'
                        : '#22C55E',
                    fontWeight: 600,
                  }}
                >
                  STATUS: {currentStep.status}
                </span>
              </div>

              {/* Step Headline */}
              <h3
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: 'clamp(1.8rem, 3.2vw, 2.8rem)',
                  fontWeight: 450,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                  margin: '0 0 16px 0',
                  color: '#FFFFFF',
                  maxWidth: '840px',
                }}
              >
                {currentStep.headline}
              </h3>

              <p
                style={{
                  fontSize: '1rem',
                  color: '#ADC2D6',
                  lineHeight: 1.6,
                  margin: '0 0 32px 0',
                  maxWidth: '720px',
                }}
              >
                {currentStep.detail}
              </p>

              {/* Hardware Telemetry Strip */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: '0.75rem',
                  color: '#FF8200',
                  letterSpacing: '0.08em',
                }}
              >
                {currentStep.telemetryLog}
              </div>
            </motion.div>
          </AnimatePresence>
        </TiltedCard>
      </div>
    </section>
  );
};
