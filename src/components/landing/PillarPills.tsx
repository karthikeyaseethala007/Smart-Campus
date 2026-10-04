import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Bell, Zap, Check } from 'lucide-react';

interface PillarData {
  id: string;
  name: string;
  icon: React.ReactNode;
  subtitle: string;
  items: string[];
  x: number;
  y: number;
}

export const PillarPills: React.FC = () => {
  const [activePillar, setActivePillar] = useState<string>('protect');
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax motion values with smooth spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 28, stiffness: 140 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 24);
    mouseY.set(y * 24);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const pillars: PillarData[] = [
    {
      id: 'protect',
      name: 'PROTECT',
      icon: <Shield size={16} />,
      subtitle: 'Physical Perimeter & Credentials',
      items: ['Access control', 'CCTV surveillance', 'Restricted zones'],
      x: -240,
      y: -120,
    },
    {
      id: 'detect',
      name: 'DETECT',
      icon: <Eye size={16} />,
      subtitle: 'Environmental & Motion Telemetry',
      items: ['PIR motion', 'MQ-2 gas/smoke', 'Occupancy sensing', 'Sensor monitoring'],
      x: 240,
      y: -110,
    },
    {
      id: 'respond',
      name: 'RESPOND',
      icon: <Bell size={16} />,
      subtitle: 'Automated Dispatch & Alerts',
      items: ['Incident management', 'Emergency alerts', 'Security response'],
      x: -220,
      y: 130,
    },
    {
      id: 'automate',
      name: 'AUTOMATE',
      icon: <Zap size={16} />,
      subtitle: 'Intelligent Energy & Actuators',
      items: ['Energy optimization', 'Relay control', 'IoT device sync', 'Occupancy automation'],
      x: 220,
      y: 140,
    },
  ];

  const active = pillars.find((p) => p.id === activePillar) || pillars[0];

  return (
    <section
      id="pillars"
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
        <div style={{ maxWidth: '820px', marginBottom: '40px' }}>
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
            <span>04 · CORE PILLARS</span>
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
            <span style={{ fontWeight: 700 }}>Four pillars.</span>{' '}
            <span 
              style={{ 
                fontStyle: 'italic', 
                fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
                fontWeight: 400,
              }}
            >
              Zero blind spots.
            </span>
          </motion.h2>

          <p style={{ fontSize: 'clamp(1rem, 1.3vw, 1.2rem)', color: '#5B6871', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
            Hover each operational pillar to inspect its integrated security capabilities and physical actuation vectors.
          </p>
        </div>

        {/* Floating Category Open Stage (Zero Container Card Clutter) */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'relative',
            minHeight: 'clamp(460px, 60vh, 580px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          }}
        >
          {/* Subtle Ambient Orange Aura */}
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 130, 0, 0.12) 0%, rgba(255, 130, 0, 0.03) 50%, transparent 70%)',
              filter: 'blur(70px)',
              pointerEvents: 'none',
            }}
          />

          {/* Central Atmospheric Visual & Selected Detail Hub */}
          <motion.div
            style={{
              position: 'relative',
              width: 'clamp(260px, 32vw, 360px)',
              aspectRatio: '1/1',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 24, 32, 0.08)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 20px 48px -12px rgba(16, 24, 32, 0.06)',
              zIndex: 2,
              padding: '36px',
              textAlign: 'center',
            }}
          >
            {/* Glowing Accent Dot */}
            <div 
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#FF8200',
                boxShadow: '0 0 12px #FF8200',
                marginBottom: '16px',
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{ width: '100%' }}
              >
                <div 
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#FF8200',
                    marginBottom: '6px',
                  }}
                >
                  {active.name}
                </div>

                <div 
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: '#101820',
                    marginBottom: '16px',
                    lineHeight: 1.3,
                  }}
                >
                  {active.subtitle}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  {active.items.map((item) => (
                    <div 
                      key={item}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.813rem',
                        color: '#5B6871',
                      }}
                    >
                      <Check size={13} style={{ color: '#FF8200', flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Four Floating Category Pills (MDX Floating Pill Concept) */}
          <div className="hidden-mobile">
            {pillars.map((pillar) => {
              const isCurrent = pillar.id === activePillar;
              return (
                <motion.button
                  key={pillar.id}
                  onClick={() => setActivePillar(pillar.id)}
                  onMouseEnter={() => setActivePillar(pillar.id)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    x: smoothX,
                    y: smoothY,
                    marginLeft: `${pillar.x}px`,
                    marginTop: `${pillar.y}px`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundColor: isCurrent ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                    border: isCurrent ? '1px solid #FF8200' : '1px solid rgba(16, 24, 32, 0.12)',
                    boxShadow: isCurrent 
                      ? '0 12px 32px -4px rgba(255, 130, 0, 0.25), 0 4px 12px rgba(16, 24, 32, 0.04)' 
                      : '0 6px 20px -2px rgba(16, 24, 32, 0.04)',
                    cursor: 'pointer',
                    zIndex: 3,
                    transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span style={{ color: isCurrent ? '#FF8200' : '#101820' }}>
                    {pillar.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
                      fontSize: '0.813rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isCurrent ? '#101820' : '#5B6871',
                    }}
                  >
                    {pillar.name}
                  </span>
                  <span 
                    style={{ 
                      width: '5px', 
                      height: '5px', 
                      borderRadius: '50%', 
                      backgroundColor: isCurrent ? '#FF8200' : 'transparent',
                    }} 
                  />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Mobile Pillar Fallback Sequence */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '10px', 
            justifyContent: 'center', 
            marginTop: '32px' 
          }}
          className="visible-mobile-only"
        >
          {pillars.map((pillar) => {
            const isCurrent = pillar.id === activePillar;
            return (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  backgroundColor: isCurrent ? '#101820' : '#FFFFFF',
                  color: isCurrent ? '#FFFFFF' : '#101820',
                  border: isCurrent ? '1px solid #101820' : '1px solid rgba(16, 24, 32, 0.12)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}
              >
                <span>{pillar.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PillarPills;
