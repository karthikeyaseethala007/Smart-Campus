import React, { useState } from 'react';
import { Shield, Eye, Flame, Zap, ArrowUpRight } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface PillarConfig {
  key: string;
  name: string;
  tagline: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  activeMetrics: string;
  targetTab: 'security' | 'safety' | 'incidents' | 'energy';
}

export const FourSystemPillars: React.FC = () => {
  const { setActiveTab } = useAppState();
  const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);

  const pillars: PillarConfig[] = [
    {
      key: 'protect',
      name: 'PROTECT',
      tagline: 'Access control + CCTV',
      subtitle: 'PERIMETER INTERLOCK',
      description: 'Synchronized solenoid locks, PIN authentication gates, and continuous high-definition optical CCTV verification.',
      icon: <Shield size={18} color="#101820" />,
      activeMetrics: '5 secured portals · 7 camera nodes',
      targetTab: 'security',
    },
    {
      key: 'detect',
      name: 'DETECT',
      tagline: 'PIR + MQ-2 + sensor network',
      subtitle: 'LIFE SAFETY & SENSORS',
      description: 'Passive infrared human presence arrays and electrochemical gas spectrometry for hazard detection.',
      icon: <Eye size={18} color="#101820" />,
      activeMetrics: '42 PIR nodes · 412 ppm baseline',
      targetTab: 'safety',
    },
    {
      key: 'respond',
      name: 'RESPOND',
      tagline: 'Incident + emergency response',
      subtitle: 'DISPATCH & COMPLIANCE',
      description: 'Automated hazard escalation, evacuation siren relays, security officer dispatch, and compliance logging.',
      icon: <Flame size={18} color="#FF8200" />,
      activeMetrics: 'Automated triage · Zero delay',
      targetTab: 'incidents',
    },
    {
      key: 'automate',
      name: 'AUTOMATE',
      tagline: 'Energy + relay + IoT automation',
      subtitle: 'ENVIRONMENTAL RELAYS',
      description: 'Autonomous occupancy-driven lighting circuits, variable ventilation dampers, and submeter peak-shaving.',
      icon: <Zap size={18} color="#FF8200" />,
      activeMetrics: '54.00 kW baseline · 6 submeters',
      targetTab: 'energy',
    },
  ];

  return (
    <div
      role="region"
      aria-label="Four System Pillars"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#5B6871',
            }}
          >
            SYSTEM ARCHITECTURE
          </span>
          <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.688rem',
              color: '#8A8F8D',
            }}
          >
            FOUR OPERATIONAL PILLARS
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {pillars.map((pillar) => {
          const isHovered = hoveredPillar === pillar.key;

          return (
            <div
              key={pillar.key}
              onClick={() => setActiveTab(pillar.targetTab)}
              onMouseEnter={() => setHoveredPillar(pillar.key)}
              onMouseLeave={() => setHoveredPillar(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveTab(pillar.targetTab)}
              style={{
                backgroundColor: isHovered ? '#FFFFFF' : '#FCFCFD',
                borderRadius: '14px',
                padding: '22px 24px',
                border: isHovered ? '1px solid rgba(255, 130, 0, 0.4)' : '1px solid rgba(16, 24, 32, 0.08)',
                boxShadow: isHovered ? '0 8px 24px -2px rgba(16, 24, 32, 0.08)' : '0 2px 8px rgba(16, 24, 32, 0.02)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '190px',
                transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top Accent line on hover */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: isHovered ? '#FF8200' : 'transparent',
                  transition: 'background-color 0.18s ease',
                }}
              />

              <div>
                {/* Header row: Name + Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: isHovered ? 'rgba(255, 130, 0, 0.1)' : 'rgba(16, 24, 32, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.18s ease',
                      }}
                    >
                      {pillar.icon}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#101820',
                          margin: 0,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {pillar.name}
                      </h3>
                      <div
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: '0.625rem',
                          color: '#8A8F8D',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {pillar.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowUpRight
                    size={16}
                    color={isHovered ? '#FF8200' : '#8C8C8C'}
                    style={{ transform: isHovered ? 'translate(2px, -2px)' : 'none', transition: 'all 0.18s ease' }}
                  />
                </div>

                {/* Tagline / Operational Meaning (prominently revealed) */}
                <div
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: isHovered ? '#FF8200' : '#101820',
                    marginBottom: '8px',
                    transition: 'color 0.18s ease',
                  }}
                >
                  {pillar.tagline}
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#5B6871',
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {pillar.description}
                </p>
              </div>

              {/* Bottom active metrics */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(16, 24, 32, 0.06)',
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.688rem',
                  color: isHovered ? '#101820' : '#8C8C8C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{pillar.activeMetrics}</span>
                <span style={{ color: '#FF8200', fontWeight: 600 }}>CONFIGURE →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
