import React from 'react';
import { Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TiltedCard } from '../reactbits/TiltedCard';

interface CameraLocation {
  id: string;
  name: string;
  zone: string;
  fps: string;
  status: 'OPTIMAL' | 'ELEVATED' | 'SECURE';
  resolution: string;
  classification: string;
  gradient: string;
}

const LOCATIONS: CameraLocation[] = [
  {
    id: 'cam-01',
    name: 'MAIN PERIMETER GATE',
    zone: 'ZONE A · VEHICULAR & PEDESTRIAN INGRESS',
    fps: '30 FPS',
    status: 'SECURE',
    resolution: '1920 × 1080',
    classification: 'ANPR & BIOMETRIC GATEWAY',
    gradient: 'linear-gradient(145deg, #131B24 0%, #080D12 100%)',
  },
  {
    id: 'cam-02',
    name: 'INNOVATION & ROBOTICS LAB',
    zone: 'ZONE B · AUTONOMOUS SYSTEMS & DRONE BAY',
    fps: '60 FPS',
    status: 'OPTIMAL',
    resolution: '1920 × 1080',
    classification: 'THERMAL & LITHIUM HAZARD SCAN',
    gradient: 'linear-gradient(145deg, #1A1F26 0%, #0A0F14 100%)',
  },
  {
    id: 'cam-03',
    name: 'CENTRAL LIBRARY ATRIUM',
    zone: 'ZONE C · ACOUSTIC & OCCUPANCY STUDY CORE',
    fps: '30 FPS',
    status: 'SECURE',
    resolution: '1920 × 1080',
    classification: 'PEOPLE DENSITY: 124 PERSONS',
    gradient: 'linear-gradient(145deg, #161D24 0%, #080C10 100%)',
  },
  {
    id: 'cam-04',
    name: 'SCIENCE & CHEMICAL WING',
    zone: 'ZONE D · HAZARDOUS MATERIAL STORAGE',
    fps: '30 FPS',
    status: 'ELEVATED',
    resolution: '1920 × 1080',
    classification: 'VENTILATION INTERLOCK LINKED',
    gradient: 'linear-gradient(145deg, #221B16 0%, #0D0A08 100%)',
  },
  {
    id: 'cam-05',
    name: 'ACADEMIC HALLWAY SPINE',
    zone: 'ZONE E · CORRIDOR DIRECTIONAL FLOW',
    fps: '30 FPS',
    status: 'SECURE',
    resolution: '1920 × 1080',
    classification: 'PIR MOTION MATRIX CORRELATION',
    gradient: 'linear-gradient(145deg, #151A22 0%, #090D12 100%)',
  },
  {
    id: 'cam-06',
    name: 'CAMPUS TIER-4 DATA CENTER',
    zone: 'ZONE F · SERVER INFRASTRUCTURE & BACKUP',
    fps: '60 FPS',
    status: 'SECURE',
    resolution: '1920 × 1080',
    classification: 'DUAL BIOMETRIC INTERLOCK ACTIVE',
    gradient: 'linear-gradient(145deg, #111D25 0%, #060E14 100%)',
  },
];

export const SurveillanceShowcase: React.FC = () => {
  return (
    <section
      id="surveillance-section"
      style={{
        position: 'relative',
        backgroundColor: '#0A0E13',
        color: '#FFFFFF',
        borderRadius: 'clamp(36px, 5vw, 64px) clamp(36px, 5vw, 64px) 0 0',
        marginTop: 'clamp(-48px, -6vh, -80px)',
        boxShadow: '0 -32px 80px rgba(0, 0, 0, 0.7)',
        padding: 'clamp(96px, 14vh, 180px) clamp(24px, 6vw, 96px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: 10,
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Eye size={14} color="#FF8200" />
            <span>OPTICAL TELEMETRY · CINEMATIC SURVEILLANCE MESH</span>
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
            Omnipresent Vision.
            <br />
            <span style={{ color: '#8C9BA5', fontWeight: 400 }}>Zero Blind Zones.</span>
          </h2>

          <p style={{ fontSize: '1rem', color: '#8C9BA5', maxWidth: '640px', lineHeight: 1.6, margin: 0 }}>
            Rather than standard camera feeds, Smart Campus streams continuous neural telemetry across key physical nodes, actively classifying human dwell time, perimeter incursions, and atmospheric changes.
          </p>
        </div>

        {/* Cinematic Grid of Location Panels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 'clamp(20px, 2.5vw, 32px)',
          }}
        >
          {LOCATIONS.map((loc) => (
            <TiltedCard
              key={loc.id}
                maxAngle={6}
                scaleOnHover={1.02}
                showGlare={true}
                style={{
                  borderRadius: '24px',
                  background: loc.gradient,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: 'clamp(28px, 3.5vw, 36px)',
                  boxSizing: 'border-box',
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.5)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top Location Header */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.625rem',
                        letterSpacing: '0.14em',
                        color: '#7C8A96',
                      }}
                    >
                      {loc.id.toUpperCase()}
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.625rem',
                        letterSpacing: '0.1em',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor:
                          loc.status === 'ELEVATED'
                            ? 'rgba(255, 130, 0, 0.15)'
                            : 'rgba(34, 197, 94, 0.12)',
                        color: loc.status === 'ELEVATED' ? '#FF8200' : '#22C55E',
                      }}
                    >
                      {loc.status === 'ELEVATED' ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                      {loc.status}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                      fontSize: 'clamp(1.4rem, 2vw, 1.7rem)',
                      fontWeight: 500,
                      letterSpacing: '-0.02em',
                      margin: '0 0 8px 0',
                      color: '#FFFFFF',
                    }}
                  >
                    {loc.name}
                  </h3>

                  <div
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.688rem',
                      color: '#8C9BA5',
                      lineHeight: 1.4,
                    }}
                  >
                    {loc.zone}
                  </div>
                </div>

                {/* Bottom Telemetry Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '16px',
                    marginTop: '24px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.563rem',
                        letterSpacing: '0.1em',
                        color: '#637381',
                        marginBottom: '4px',
                      }}
                    >
                      ANALYTIC INFERENCE
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: '0.75rem',
                        color: '#ADC2D6',
                        fontWeight: 500,
                      }}
                    >
                      {loc.classification}
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '0.688rem',
                      color: '#FF8200',
                    }}
                  >
                    {loc.fps}
                  </span>
                </div>
              </TiltedCard>
            ))}
        </div>
      </div>
    </section>
  );
};
