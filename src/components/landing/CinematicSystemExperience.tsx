import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play } from 'lucide-react';
import { usePageTransition } from '../layout/PageTransition';

export const CinematicSystemExperience: React.FC = () => {
  const { startOperationsTransition } = usePageTransition();
  const { scrollYProgress } = useScroll();
  const [isPlaying, setIsPlaying] = useState(false);

  // Subsystems / Architectural Layers
  const layers = [
    { id: 'pir', label: 'PIR' },
    { id: 'mq2', label: 'MQ-2' },
    { id: 'cctv', label: 'CCTV' },
    { id: 'access', label: 'ACCESS' },
    { id: 'energy', label: 'ENERGY' },
    { id: 'iot', label: 'IOT' },
  ];

  const [activeLayer, setActiveLayer] = useState('cctv');

  // Entrance and exit scale animations
  const stageScale = useTransform(scrollYProgress, [0.30, 0.38, 0.48, 0.54], [0.94, 1, 1, 0.96]);
  const stageOpacity = useTransform(scrollYProgress, [0.28, 0.34, 0.50, 0.56], [0.2, 1, 1, 0.4]);

  return (
    <section
      id="cinematic-experience"
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#FCFCFD',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(64px, 8vh, 100px) clamp(20px, 4vw, 64px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          width: '100%',
          maxWidth: '1240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(28px, 4vh, 48px)',
          scale: stageScale,
          opacity: stageOpacity,
        }}
      >
        {/* =========================================================================
            LARGE ROUNDED BLACK CINEMATIC STAGE (Matching MDX 15.5s Ground Truth)
            ========================================================================= */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(440px, 60vh, 620px)',
            backgroundColor: '#070707',
            borderRadius: 'clamp(24px, 3vw, 36px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 32px 80px -20px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => {
            setIsPlaying(!isPlaying);
            startOperationsTransition('overview');
          }}
        >
          {/* Subtle Ambient Background Glow inside Stage */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              height: '60%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 130, 0, 0.14) 0%, rgba(255, 130, 0, 0.02) 55%, transparent 75%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          {/* Dotted Particle Matrix / Constellation Mesh behind Trigger (Exact MDX 15.5s signature) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '420px',
              height: '240px',
              opacity: 0.32,
              pointerEvents: 'none',
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
            }}
          />

          {/* Centered Play / Watch Interaction (Exact MDX 15.5s: ▷ | WATCH SHOWREEL) */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px 36px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.5)';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid rgba(255, 255, 255, 0.85)',
                color: '#FFFFFF',
              }}
            >
              <Play size={18} fill="#FFFFFF" style={{ marginLeft: '3px' }} />
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />

            <div
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: 'clamp(1rem, 1.4vw, 1.35rem)',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
              }}
            >
              WATCH DECISION ENGINE
            </div>
          </div>

          {/* Bottom Stage Architectural Indicators (PIR, MQ-2, CCTV, ACCESS, ENERGY, IOT) */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {layers.map((layer) => {
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLayer(layer.id);
                  }}
                  style={{
                    background: 'none',
                    border: isActive ? '1px solid #FF8200' : '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: isActive ? 'rgba(255, 130, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? '#FF8200' : 'rgba(255, 255, 255, 0.5)',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.688rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {layer.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            SUPPORTING EDITORIAL COPY (Cleanly positioned below stage)
            ========================================================================= */}
        <div
          style={{
            width: '100%',
            maxWidth: '1240px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '32px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: '580px' }}>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: 'clamp(2.2rem, 3.8vw, 3.6rem)',
                fontWeight: 450,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                color: '#101820',
                margin: 0,
              }}
            >
              Engineered with Intention.
              <br />
              <span style={{ fontWeight: 400, color: '#5B6871' }}>Built to Protect.</span>
            </h2>
          </div>

          <div style={{ maxWidth: '460px', paddingTop: '6px' }}>
            <p
              style={{
                fontSize: 'clamp(0.875rem, 1.05vw, 1rem)',
                color: '#5B6871',
                lineHeight: 1.6,
                margin: 0,
                fontWeight: 400,
              }}
            >
              From millisecond hazard detection to instant automated containment, every layer is designed to respond autonomously across campus boundaries.
            </p>
          </div>
        </div>

        {/* Bottom Stage Indicator Ticks (3rd tick active) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: '1.5px',
                height: idx === 2 ? '20px' : '12px',
                backgroundColor: idx === 2 ? '#FF8200' : 'rgba(16, 24, 32, 0.2)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default CinematicSystemExperience;
