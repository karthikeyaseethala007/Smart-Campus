import React from 'react';
import { Shield, Eye, BellRing, Zap } from 'lucide-react';
import { TiltedCard } from '../reactbits/TiltedCard';

interface PillarChapter {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  specs: string[];
  telemetry: string;
  tag: string;
}

const PILLARS: PillarChapter[] = [
  {
    id: 'protect',
    num: '01',
    title: 'PROTECT',
    subtitle: 'Controlled perimeter & multi-factor access barriers',
    description:
      'Biometric authentication, anti-passback turnstiles, and remote solenoid interlocks isolate unauthorized incursions before physical entry occurs.',
    icon: Shield,
    specs: ['Sub-second Door Unlock Latency', 'Anti-Tailgating Sensor Mesh', 'Zero-Trust Role Permissions'],
    telemetry: '6 ACTIVE GATES · ZERO ANOMALIES',
    tag: 'PERIMETER DEFENSE',
  },
  {
    id: 'detect',
    num: '02',
    title: 'DETECT',
    subtitle: 'Continuous neural vision & environmental sensory mesh',
    description:
      'AI-accelerated camera feeds cross-reference optical motion with PIR presence and MQ-2 chemical PPM levels to identify early smoke, fire, and intrusion.',
    icon: Eye,
    specs: ['Multi-Stream 1080p Telemetry', 'PPM Gas Spike Discrimination', 'Passive Infrared Zone Tracking'],
    telemetry: '16 ACTIVE SENSORS · 42 PPM NORMAL',
    tag: 'OMNIPRESENT SENSING',
  },
  {
    id: 'respond',
    num: '03',
    title: 'RESPOND',
    subtitle: 'Deterministic escalation & autonomous protocol dispatch',
    description:
      'The moment an anomaly crosses severity thresholds, automated lockdown sequences seal contaminated zones, trip fire alarms, and dispatch emergency personnel.',
    icon: BellRing,
    specs: ['Zero-Human Dispatch Protocols', 'Zone Contamination Isolation', 'Direct Incident Event Logging'],
    telemetry: 'DISPATCH READY · LATENCY < 120ms',
    tag: 'AUTONOMOUS ESCALATION',
  },
  {
    id: 'automate',
    num: '04',
    title: 'AUTOMATE',
    subtitle: 'Self-regulating energy demand & facility IoT schedules',
    description:
      'Lighting, HVAC actuators, and backup power grids autonomously calibrate based on verified occupancy, shaving peak campus load while sustaining continuous security.',
    icon: Zap,
    specs: ['Real-Time Grid Load Shaving', 'Occupancy-Triggered Relays', 'Automated Environmental HVAC'],
    telemetry: 'CURRENT LOAD: 54.85 kW · PEAK SHAVED 18%',
    tag: 'INFRASTRUCTURE INTELLIGENCE',
  },
];

export const FourPillarsSection: React.FC = () => {
  return (
    <section
      id="four-pillars-section"
      style={{
        position: 'relative',
        backgroundColor: '#F7F9FB',
        color: '#101820',
        padding: 'clamp(80px, 12vh, 160px) clamp(24px, 6vw, 96px)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Section Header */}
        <div style={{ marginBottom: 'clamp(48px, 8vh, 80px)', maxWidth: '720px' }}>
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
              gap: '10px',
            }}
          >
            <span>CORE ARCHITECTURE</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
            <span>FOUR OPERATIONAL CHAPTERS</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: 'clamp(2.4rem, 4.5vw, 4.2rem)',
              fontWeight: 450,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              margin: '0 0 20px 0',
              color: '#101820',
            }}
          >
            Engineered to Protect.
            <br />
            <span style={{ color: '#5B6871', fontWeight: 400 }}>Built to Automate.</span>
          </h2>

          <p style={{ fontSize: '1rem', color: '#5B6871', lineHeight: 1.6, margin: 0 }}>
            Smart Campus replaces isolated security silos with four coordinated disciplines that communicate instantaneously across the physical infrastructure.
          </p>
        </div>

        {/* Scroll-Stacked Visual Chapters */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(40px, 6vh, 64px)',
          }}
        >
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                style={{
                  position: 'sticky',
                  top: `calc(100px + ${idx * 28}px)`,
                  zIndex: idx + 1,
                }}
              >
                <TiltedCard
                  maxAngle={5}
                  scaleOnHover={1.01}
                  showGlare={true}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '28px',
                    border: '1px solid rgba(16, 24, 32, 0.08)',
                    boxShadow: '0 24px 60px -16px rgba(16, 24, 32, 0.08)',
                    padding: 'clamp(32px, 5vw, 64px)',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 'clamp(32px, 5vw, 64px)',
                      alignItems: 'center',
                    }}
                  >
                    {/* Chapter Narrative */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '20px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#FF8200',
                          }}
                        >
                          {pillar.num}
                        </span>
                        <span style={{ width: 24, height: 1, backgroundColor: 'rgba(16, 24, 32, 0.15)' }} />
                        <span
                          style={{
                            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                            fontSize: '0.688rem',
                            letterSpacing: '0.14em',
                            color: '#7C8A96',
                          }}
                        >
                          {pillar.tag}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                          fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
                          fontWeight: 500,
                          letterSpacing: '-0.03em',
                          lineHeight: 1.1,
                          color: '#101820',
                          margin: '0 0 16px 0',
                        }}
                      >
                        {pillar.title}
                      </h3>

                      <p
                        style={{
                          fontSize: '1.05rem',
                          color: '#2C3A45',
                          lineHeight: 1.5,
                          marginBottom: '16px',
                          fontWeight: 500,
                        }}
                      >
                        {pillar.subtitle}
                      </p>

                      <p
                        style={{
                          fontSize: '0.925rem',
                          color: '#5B6871',
                          lineHeight: 1.6,
                          marginBottom: '28px',
                          maxWidth: '480px',
                        }}
                      >
                        {pillar.description}
                      </p>

                      {/* Technical Specs List */}
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        {pillar.specs.map((spec) => (
                          <li
                            key={spec}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.85rem',
                              color: '#465561',
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor: '#FF8200',
                              }}
                            />
                            <span>{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Chapter Visual Telemetry Plate */}
                    <div
                      style={{
                        backgroundColor: '#101820',
                        color: '#FFFFFF',
                        borderRadius: '20px',
                        padding: 'clamp(28px, 4vw, 44px)',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '280px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top Icon & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 130, 0, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FF8200',
                          }}
                        >
                          <Icon size={24} />
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                            fontSize: '0.625rem',
                            letterSpacing: '0.12em',
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#ADC2D6',
                          }}
                        >
                          AUTONOMIC KERNEL
                        </span>
                      </div>

                      {/* Telemetry Indicator */}
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                            fontSize: '0.688rem',
                            letterSpacing: '0.14em',
                            color: '#7C8A96',
                            marginBottom: '8px',
                          }}
                        >
                          LIVE FIELD TELEMETRY
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                            fontSize: 'clamp(0.875rem, 1.2vw, 1.05rem)',
                            color: '#FF8200',
                            fontWeight: 500,
                          }}
                        >
                          {pillar.telemetry}
                        </div>
                      </div>

                      {/* Ambient corner glow */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-20%',
                          right: '-20%',
                          width: '160px',
                          height: '160px',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(255, 130, 0, 0.25) 0%, transparent 70%)',
                          filter: 'blur(30px)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </div>
                </TiltedCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
