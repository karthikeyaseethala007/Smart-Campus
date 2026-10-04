import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity } from 'lucide-react';

interface ZoneItem {
  id: string;
  name: string;
  code: string;
  cctvStream: string;
  accessState: string;
  sensorReading: string;
  status: 'LIVE' | 'STANDBY' | 'OCCUPIED';
  xPercent: number;
  yPercent: number;
}

export const SecurityPreview: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<string>('gate');

  const zones: ZoneItem[] = [
    {
      id: 'gate',
      name: 'MAIN GATE PERIMETER',
      code: 'ZONE 01',
      cctvStream: '1920×1080 · 60 FPS · Optical Dome',
      accessState: 'Turnstiles Active · 2 Credentials / sec',
      sensorReading: 'PIR Perimeter Barrier Armed',
      status: 'LIVE',
      xPercent: 20,
      yPercent: 25,
    },
    {
      id: 'robotics',
      name: 'INNOVATION & ROBOTICS LAB',
      code: 'ZONE 02',
      cctvStream: '2560×1440 · 60 FPS · Optical Dome',
      accessState: 'RFID Tier-3 Auth Required',
      sensorReading: 'PIR Motion Active · 8 Present',
      status: 'OCCUPIED',
      xPercent: 75,
      yPercent: 22,
    },
    {
      id: 'library',
      name: 'CENTRAL LIBRARY ATRIUM',
      code: 'ZONE 03',
      cctvStream: '1920×1080 · 30 FPS · Wide Angle',
      accessState: 'Open Access Concourse · Egress Tracked',
      sensorReading: 'Occupancy Baseline 64%',
      status: 'LIVE',
      xPercent: 32,
      yPercent: 70,
    },
    {
      id: 'science',
      name: 'SCIENCE & PHYSICS LAB',
      code: 'ZONE 04',
      cctvStream: '2560×1440 · 30 FPS · Thermal & Optical',
      accessState: 'Interlock Sealed · Two-Person Rule',
      sensorReading: 'MQ-2 Clean: 36 PPM (Safe)',
      status: 'LIVE',
      xPercent: 82,
      yPercent: 68,
    },
    {
      id: 'hallway',
      name: 'ACADEMIC HALLWAY SOUTH',
      code: 'ZONE 05',
      cctvStream: '1920×1080 · 30 FPS · Live Fixed',
      accessState: 'Free Egress Portals · Magnetic Hold',
      sensorReading: 'PIR Active · Dynamic Luminescence',
      status: 'LIVE',
      xPercent: 50,
      yPercent: 18,
    },
    {
      id: 'complab',
      name: 'COMPUTER LAB 301',
      code: 'ZONE 06',
      cctvStream: '1920×1080 · 30 FPS · Occupancy Monitored',
      accessState: 'PIN & Smart Card Secured',
      sensorReading: 'Smart Relay Load 54.85 kW',
      status: 'OCCUPIED',
      xPercent: 18,
      yPercent: 78,
    },
    {
      id: 'datacenter',
      name: 'DATA CENTER / SERVER ROOM',
      code: 'ZONE 07',
      cctvStream: '3840×2160 · 60 FPS · 4K Biometric Shield',
      accessState: 'Level-5 Biometric + Audit Enforced',
      sensorReading: 'Precision Gas & Temp Monitored',
      status: 'LIVE',
      xPercent: 65,
      yPercent: 80,
    },
  ];

  const activeZone = zones.find((z) => z.id === selectedZone) || zones[0];

  return (
    <section
      id="security-intelligence"
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
        <div style={{ maxWidth: '820px', marginBottom: '56px' }}>
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
            <span>05 · SECURITY INTELLIGENCE</span>
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
            <span style={{ fontWeight: 700 }}>Security</span>{' '}
            <span 
              style={{ 
                fontStyle: 'italic', 
                fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
                fontWeight: 400,
              }}
            >
              that sees.
            </span>
          </motion.h2>

          <p style={{ fontSize: 'clamp(1rem, 1.3vw, 1.2rem)', color: '#5B6871', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
            Unified optical streams and credential verification spanning every critical perimeter, laboratory, and concourse across the campus.
          </p>
        </div>

        {/* Large Cinematic Composition Area */}
        <div
          style={{
            position: 'relative',
            minHeight: '520px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(16, 24, 32, 0.08)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'clamp(24px, 4vw, 40px)',
          }}
        >
          {/* Subtle Grid Coordinate Map Background */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.04,
              backgroundImage: 'radial-gradient(circle, #101820 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none',
            }}
          />

          {/* Top Architectural Telemetry Bar */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid rgba(16, 24, 32, 0.08)',
              paddingBottom: '20px',
              position: 'relative',
              zIndex: 3,
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 10px #22c55e',
                }} 
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#101820' }}>
                7 CAMPUS SECTORS ACTIVE
              </span>
              <span style={{ color: 'rgba(16, 24, 32, 0.3)' }}>|</span>
              <span style={{ fontSize: '0.75rem', color: '#5B6871', fontFamily: 'var(--font-mono, monospace)' }}>
                LATENCY 4.2ms
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} style={{ color: '#FF8200' }} />
              <span style={{ fontSize: '0.688rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5B6871' }}>
                CONTINUOUS OPTICAL MESH
              </span>
            </div>
          </div>

          {/* Central Active Zone Intelligence Display */}
          <div 
            style={{ 
              position: 'relative', 
              zIndex: 3, 
              margin: 'clamp(32px, 6vh, 64px) 0',
              maxWidth: '640px',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeZone.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 130, 0, 0.1)',
                    color: '#FF8200',
                    fontSize: '0.688rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                  }}
                >
                  <Sparkles size={12} />
                  <span>{activeZone.code} · {activeZone.status}</span>
                </div>

                <h3
                  style={{
                    fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: '#101820',
                    margin: '0 0 16px 0',
                  }}
                >
                  {activeZone.name}
                </h3>

                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                    gap: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(16, 24, 32, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.688rem', color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                      CCTV STREAM
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#101820' }}>
                      {activeZone.cctvStream}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.688rem', color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                      ACCESS LEDGER
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#101820' }}>
                      {activeZone.accessState}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.688rem', color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                      SENSOR TELEMETRY
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FF8200' }}>
                      {activeZone.sensorReading}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating Campus Location Pills (Interactive Nodes) */}
          <div 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px', 
              position: 'relative', 
              zIndex: 3,
              borderTop: '1px solid rgba(16, 24, 32, 0.08)',
              paddingTop: '20px',
            }}
          >
            {zones.map((zone) => {
              const isSelected = zone.id === selectedZone;
              return (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  onMouseEnter={() => setSelectedZone(zone.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    backgroundColor: isSelected ? '#101820' : 'rgba(255, 255, 255, 0.9)',
                    color: isSelected ? '#FFFFFF' : '#101820',
                    border: isSelected ? '1px solid #101820' : '1px solid rgba(16, 24, 32, 0.1)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  <span 
                    style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: isSelected ? '#FF8200' : '#22c55e',
                    }} 
                  />
                  <span>{zone.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityPreview;
