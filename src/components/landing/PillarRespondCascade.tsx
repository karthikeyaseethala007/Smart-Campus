import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, AlertTriangle, Bell, Video, FileText, Unlock, Play, RotateCcw } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface CascadeStep {
  id: string;
  step: string;
  title: string;
  delay: string;
  desc: string;
  icon: React.ElementType;
}

export const PillarRespondCascade: React.FC = () => {
  const { simulateFire, resetSimulation, campusStatus } = useAppState();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const steps: CascadeStep[] = [
    {
      id: 'step-1',
      step: '01',
      title: 'Combustion Signal',
      delay: '+0.0s',
      desc: 'MQ-2 sensor at Science & Physics Lab records 380 PPM aerosol obscuration.',
      icon: Flame,
    },
    {
      id: 'step-2',
      step: '02',
      title: 'Threshold Evaluation',
      delay: '+0.3s',
      desc: 'ESP32 edge core confirms critical threshold > 250 PPM for 1.2 consecutive seconds.',
      icon: AlertTriangle,
    },
    {
      id: 'step-3',
      step: '03',
      title: 'Life Safety Alarm',
      delay: '+0.7s',
      desc: 'Local FM-200 clean agent strobe and audible siren relays energized.',
      icon: Bell,
    },
    {
      id: 'step-4',
      step: '04',
      title: 'Optical PTZ Lock',
      delay: '+1.1s',
      desc: 'CCTV Camera 04 pivots from wide angle to chemical fume hood coordinates.',
      icon: Video,
    },
    {
      id: 'step-5',
      step: '05',
      title: 'Incident Dispatch',
      delay: '+1.5s',
      desc: 'Critical incident #INC-842 pushed to Operations Desk with priority routing.',
      icon: FileText,
    },
    {
      id: 'step-6',
      step: '06',
      title: 'Fail-Safe Egress',
      delay: '+2.0s',
      desc: 'Magnetic solenoid locks de-energize to allow immediate evacuation.',
      icon: Unlock,
    },
  ];

  const handleStartDrill = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStepIndex(0);
    simulateFire();

    // Step-by-step sequential advance
    const delays = [300, 700, 1100, 1500, 2000];
    delays.forEach((delay, idx) => {
      setTimeout(() => {
        setActiveStepIndex(idx + 1);
      }, delay);
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setActiveStepIndex(-1);
    resetSimulation();
  };

  // Sync if simulation was reset globally
  useEffect(() => {
    if (campusStatus === 'SECURE' && isRunning && activeStepIndex === 5) {
      // Completed drill
    }
  }, [campusStatus, isRunning, activeStepIndex]);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-paper-white)',
        borderRadius: '1.5rem',
        padding: '36px',
        border: 'var(--border-hairline)',
        boxShadow: 'var(--shadow-subtle-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-sienna-brown)',
                fontWeight: 600,
              }}
            >
              Pillar 03 · RESPOND
            </span>
            <span style={{ color: 'var(--color-smoke-gray)' }}>/</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-gray)' }}>
              Deterministic Response Chain
            </span>
          </div>

          <h3
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--color-ink-black)',
            }}
          >
            Sub-Second Incident Cascade
          </h3>

          <p
            style={{
              fontSize: '0.938rem',
              color: 'var(--color-slate-gray)',
              lineHeight: 1.6,
              margin: '8px 0 0 0',
              maxWidth: '620px',
            }}
          >
            When critical thresholds are exceeded, seconds decide outcomes. The system executes a verified hardware-orchestrated cascade without waiting for manual intervention.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleStartDrill}
            disabled={isRunning && activeStepIndex < 5}
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              backgroundColor: isRunning ? '#ff0000' : 'var(--color-ink-black)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.813rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isRunning ? '0 4px 16px rgba(255, 0, 0, 0.4)' : 'var(--shadow-subtle)',
              transition: 'all 0.2s var(--ease-out)',
            }}
          >
            <Play size={14} />
            <span>{isRunning ? 'Cascade Active' : 'Initiate Emergency Drill'}</span>
          </button>

          {isRunning && (
            <button
              onClick={handleReset}
              style={{
                padding: '12px 20px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-ink-black)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.813rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset to Nominal</span>
            </button>
          )}
        </div>
      </div>

      {/* 6-Step Horizontal / Responsive Cascade Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          position: 'relative',
        }}
      >
        {steps.map((item, index) => {
          const isCurrent = activeStepIndex === index;
          const isCompleted = activeStepIndex > index;

          return (
            <motion.div
              key={item.id}
              animate={{
                backgroundColor: isCurrent
                  ? 'rgba(255, 0, 0, 0.08)'
                  : isCompleted
                  ? 'var(--color-primary-100)'
                  : 'var(--color-fog-white)',
                borderColor: isCurrent
                  ? '#ff0000'
                  : isCompleted
                  ? 'var(--color-sienna-brown)'
                  : 'rgba(16, 24, 32, 0.08)',
                scale: isCurrent ? 1.02 : 1,
              }}
              transition={{ duration: 0.2 }}
              style={{
                borderRadius: '1rem',
                padding: '20px',
                border: '1px solid',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '220px',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: isCurrent ? '#ff0000' : isCompleted ? 'var(--color-sienna-brown)' : 'var(--color-slate-gray)',
                    }}
                  >
                    {item.step}
                  </span>

                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isCurrent ? '#ff0000' : 'rgba(0,0,0,0.06)',
                      color: isCurrent ? '#ffffff' : 'var(--color-slate-gray)',
                      fontWeight: 600,
                    }}
                  >
                    {item.delay}
                  </span>
                </div>

                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? '#ff0000' : isCompleted ? 'var(--color-ink-black)' : 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCurrent || isCompleted ? '#ffffff' : 'var(--color-slate-gray)',
                    marginBottom: '14px',
                  }}
                >
                  <item.icon size={16} />
                </div>

                <h4
                  style={{
                    fontSize: '0.938rem',
                    fontWeight: 600,
                    color: isCurrent ? '#ff0000' : 'var(--color-ink-black)',
                    margin: '0 0 8px 0',
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h4>
              </div>

              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-slate-gray)',
                  lineHeight: 1.45,
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
