import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Eye, Cpu, ShieldCheck, Zap } from 'lucide-react';

export const EditorialSceneTwo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const steps = [
    {
      word: 'DETECT',
      icon: <Eye size={18} />,
      desc: 'Multi-spectral optical & sensor telemetry ingestion',
      metric: '< 2.4ms Ingest',
    },
    {
      word: 'ANALYZE',
      icon: <Cpu size={18} />,
      desc: 'Edge-accelerated spatial correlation & threat verification',
      metric: 'Zero False Alarms',
    },
    {
      word: 'DECIDE',
      icon: <ShieldCheck size={18} />,
      desc: 'Autonomous policy matrix & containment escalation',
      metric: 'Level-5 Protocols',
    },
    {
      word: 'RESPOND',
      icon: <Zap size={18} />,
      desc: 'Automated physical lockdown, damper isolation & dispatch',
      metric: 'Sub-Second Action',
    },
  ];

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (progress) => {
      if (progress < 0.25) setActiveStep(0);
      else if (progress < 0.5) setActiveStep(1);
      else if (progress < 0.75) setActiveStep(2);
      else setActiveStep(3);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const sceneOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.2, 1, 1, 0.2]);
  const sceneScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 1.02]);

  return (
    <div
      ref={containerRef}
      id="editorial-scene-2"
      style={{
        position: 'relative',
        height: '200vh',
        backgroundColor: '#FCFCFD',
      }}
    >
      {/* Sticky 100vh Viewport Stage */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 6vh, 64px) clamp(24px, 6vw, 96px)',
          boxSizing: 'border-box',
        }}
      >
        <motion.div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '1100px',
            width: '100%',
            opacity: sceneOpacity,
            scale: sceneScale,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: '#FF8200',
              marginBottom: '20px',
            }}
          >
            <span>DECISION PIPELINE ARCHITECTURE</span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
              fontSize: 'clamp(2.6rem, 5.8vw, 5.2rem)',
              fontWeight: 300,
              letterSpacing: '-0.04em',
              lineHeight: 1.06,
              color: '#101820',
              margin: '0 0 16px 0',
            }}
          >
            <span style={{ fontWeight: 300, color: '#5B6871' }}>FROM DETECTION</span>{' '}
            <span style={{ fontWeight: 700 }}>TO RESPONSE.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(1rem, 1.3vw, 1.25rem)',
              color: '#5B6871',
              margin: '0 0 48px 0',
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            Signals become decisions. Decisions become actions.
          </p>

          {/* Animated 4-word pipeline: DETECT -> ANALYZE -> DECIDE -> RESPOND */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              width: '100%',
              maxWidth: '1000px',
              margin: '0 auto',
            }}
          >
            {steps.map((step, idx) => {
              const isActive = idx === activeStep;
              const isPast = idx < activeStep;
              return (
                <div
                  key={step.word}
                  style={{
                    position: 'relative',
                    padding: '24px 20px',
                    borderRadius: '16px',
                    backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                    border: isActive ? '1px solid #FF8200' : '1px solid rgba(16, 24, 32, 0.08)',
                    boxShadow: isActive
                      ? '0 16px 36px -8px rgba(255, 130, 0, 0.18), 0 4px 12px rgba(16, 24, 32, 0.04)'
                      : 'none',
                    textAlign: 'left',
                    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <span
                      style={{
                        color: isActive || isPast ? '#FF8200' : '#8C8C8C',
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {step.icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: '0.688rem',
                        fontWeight: 700,
                        color: isActive ? '#FF8200' : '#8C8C8C',
                      }}
                    >
                      0{idx + 1}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: isActive ? '#101820' : '#5B6871',
                      marginBottom: '6px',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {step.word}
                  </div>

                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#5B6871',
                      lineHeight: 1.45,
                      marginBottom: '10px',
                    }}
                  >
                    {step.desc}
                  </div>

                  <div
                    style={{
                      fontSize: '0.688rem',
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 600,
                      color: isActive ? '#FF8200' : '#8C8C8C',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {step.metric}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditorialSceneTwo;
