import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Shield, Eye, Bell, Zap } from 'lucide-react';

interface PillarItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  subtitle: string;
  features: string[];
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const FourPillarsOrbit: React.FC = () => {
  const [activePillar, setActivePillar] = useState('protect');
  const stageRef = useRef<HTMLDivElement>(null);

  // Mouse parallax motion values with smooth spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 30);
    mouseY.set(y * 30);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const pillars: PillarItem[] = [
    {
      id: 'protect',
      name: 'PROTECT',
      icon: <Shield size={14} />,
      subtitle: 'Access Control & Perimeter Shields',
      features: ['Tier-5 biometric validation', 'Turnstile automated ingress', 'Anti-tailgating surveillance'],
      corner: 'top-left',
    },
    {
      id: 'detect',
      name: 'DETECT',
      icon: <Eye size={14} />,
      subtitle: 'Environmental & Motion Telemetry',
      features: ['PIR occupancy vectors', 'MQ-2 toxic gas & smoke bus', 'Thermal anomaly tracking'],
      corner: 'top-right',
    },
    {
      id: 'respond',
      name: 'RESPOND',
      icon: <Bell size={14} />,
      subtitle: 'Automated Containment & Alerts',
      features: ['Emergency magnetic lockdown', 'Sub-second security dispatch', 'Real-time incident audit'],
      corner: 'bottom-left',
    },
    {
      id: 'automate',
      name: 'AUTOMATE',
      icon: <Zap size={14} />,
      subtitle: 'Intelligent Energy & Actuators',
      features: ['Adaptive lighting relays', 'Dynamic power load shedding', 'Workstation IoT sync'],
      corner: 'bottom-right',
    },
  ];

  const current = pillars.find((p) => p.id === activePillar) || pillars[0];

  return (
    <section
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      id="four-pillars-orbit"
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#FCFCFD',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'clamp(90px, 12vh, 120px) clamp(24px, 5vw, 64px) clamp(40px, 5vh, 60px)',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Soft Studio Ambient Warmth */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(500px, 65vw, 900px)',
          aspectRatio: '1/1',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 130, 0, 0.08) 0%, rgba(255, 130, 0, 0.015) 50%, transparent 75%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Row (Matching MDX 18.0s: Made with Intention. Meant to Be Felt.) */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '32px',
          zIndex: 3,
        }}
      >
        <div style={{ maxWidth: '560px' }}>
          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.3rem, 4.2vw, 3.8rem)',
              fontWeight: 450,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              color: '#101820',
              margin: 0,
            }}
          >
            Made with Intention.
            <br />
            <span style={{ fontWeight: 400, color: '#5B6871' }}>Built to Protect.</span>
          </h2>
        </div>

        <div style={{ maxWidth: '440px', paddingTop: '8px' }}>
          <p
            style={{
              fontSize: 'clamp(0.875rem, 1.05vw, 1rem)',
              color: '#5B6871',
              lineHeight: 1.6,
              margin: 0,
              fontWeight: 400,
            }}
          >
            From the way signals coordinate to how actuators fire, every part of the infrastructure is engineered to safeguard campus life.
          </p>
        </div>
      </div>

      {/* Central Floating Stage (Soft Cream/Gray Particle Cloud + 4 Delicate Capsule Controls) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1100px',
          height: 'clamp(460px, 60vh, 580px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '20px 0',
        }}
      >
        {/* Soft Tactile Particle Object (Desaturated, soft cream/gray particle cloud) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(420px, 48vw, 680px)',
            aspectRatio: '1/1',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <motion.div
            style={{
              width: '100%',
              height: '100%',
              x: smoothX,
              y: smoothY,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Soft Ground Contact Shadow */}
            <div
              style={{
                position: 'absolute',
                bottom: '12%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '32px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(16, 24, 32, 0.12) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Desaturated Organic Particle Master Video */}
            <video
              src="/assets/hero/hero_particle_master_1080p.mp4"
              poster="/assets/hero/poster.png"
              muted
              playsInline
              autoPlay
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                mixBlendMode: 'multiply',
                filter: 'grayscale(0.65) contrast(0.98) brightness(1.03)',
                opacity: 0.88,
              }}
            />
          </motion.div>
        </div>

        {/* 4 Delicate Floating Capsule Controls around the perimeter */}
        {pillars.map((pillar) => {
          const isActive = activePillar === pillar.id;

          // Spatial positions matching MDX ref_18.0s.png
          let positionStyle: React.CSSProperties = {};
          if (pillar.corner === 'top-left') {
            positionStyle = { top: '18%', left: '12%' };
          } else if (pillar.corner === 'top-right') {
            positionStyle = { top: '18%', right: '12%' };
          } else if (pillar.corner === 'bottom-left') {
            positionStyle = { bottom: '22%', left: '14%' };
          } else if (pillar.corner === 'bottom-right') {
            positionStyle = { bottom: '22%', right: '14%' };
          }

          return (
            <motion.button
              key={pillar.id}
              onClick={() => setActivePillar(pillar.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              style={{
                position: 'absolute',
                ...positionStyle,
                zIndex: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '9999px',
                backgroundColor: isActive ? '#FF8200' : 'rgba(255, 255, 255, 0.85)',
                color: isActive ? '#FFFFFF' : '#101820',
                border: isActive ? '1px solid #FF8200' : '1px solid rgba(16, 24, 32, 0.1)',
                backdropFilter: 'blur(12px)',
                boxShadow: isActive
                  ? '0 8px 24px -2px rgba(255, 130, 0, 0.35)'
                  : '0 4px 16px -2px rgba(0, 0, 0, 0.06)',
                fontSize: '0.781rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
              }}
            >
              <span style={{ color: isActive ? '#FFFFFF' : '#FF8200' }}>
                {pillar.icon}
              </span>
              <span>{pillar.name}</span>
            </motion.button>
          );
        })}

        {/* Active Pillar Minimal Context Readout (Quiet status bar at bottom of stage) */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 18px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(16, 24, 32, 0.08)',
            fontSize: '0.719rem',
            color: '#5B6871',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF8200' }} />
          <span style={{ fontWeight: 600, color: '#101820' }}>{current.name}:</span>
          <span>{current.subtitle}</span>
        </div>
      </div>

      {/* Bottom Stage Indicator Ticks */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            style={{
              width: '1.5px',
              height: idx === 3 ? '20px' : '12px',
              backgroundColor: idx === 3 ? '#FF8200' : 'rgba(16, 24, 32, 0.2)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default FourPillarsOrbit;
