import React, { useState } from 'react';
import { Shield, Eye, Flame, Zap, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface PillarConfig {
  key: string;
  name: string;
  tagline: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  activeMetrics: string;
  operationalActions: { label: string; action: () => void; isPrimary?: boolean }[];
  targetTab: 'security' | 'safety' | 'incidents' | 'energy';
}

export const FourSystemPillars: React.FC = () => {
  const {
    setActiveTab,
    acknowledgeIncident,
    incidents,
    triggerMQ2Elevation,
    doors,
  } = useAppState();

  const [activePillar, setActivePillar] = useState<string | null>(null);

  const pillars: PillarConfig[] = [
    {
      key: 'protect',
      name: 'PROTECT',
      tagline: 'Access Control & Perimeter Interlock',
      subtitle: 'HARDWARE INTERLOCK',
      description: 'Synchronized solenoid locks, PIN authentication gates, and continuous high-definition optical CCTV verification.',
      icon: <Shield size={18} color="var(--color-ink-black)" />,
      activeMetrics: `${doors.filter((d) => d.lockStatus === 'locked').length}/${doors.length} Secured Portals · 7 CCTV Streams`,
      targetTab: 'security',
      operationalActions: [
        {
          label: 'OPEN ACCESS CONSOLE',
          action: () => setActiveTab('security'),
          isPrimary: true,
        },
        {
          label: 'VERIFY ALL SOLENOIDS',
          action: () => setActiveTab('security'),
        },
      ],
    },
    {
      key: 'detect',
      name: 'DETECT',
      tagline: 'Sensors, Life Safety & CCTV',
      subtitle: 'MULTISENSOR TELEMETRY',
      description: 'Passive infrared human presence arrays and electrochemical gas spectrometry for hazardous condition detection.',
      icon: <Eye size={18} color="var(--color-ink-black)" />,
      activeMetrics: '42 PIR nodes · 312 ppm baseline',
      targetTab: 'safety',
      operationalActions: [
        {
          label: 'OPEN SENSOR GRID',
          action: () => setActiveTab('safety'),
          isPrimary: true,
        },
        {
          label: 'TRIGGER MQ-2 TEST',
          action: () => triggerMQ2Elevation(640),
        },
      ],
    },
    {
      key: 'respond',
      name: 'RESPOND',
      tagline: 'Incident Triage & Containment',
      subtitle: 'DISPATCH & COMPLIANCE',
      description: 'Automated hazard escalation, evacuation siren relays, security officer dispatch, and tamper-proof compliance logging.',
      icon: <Flame size={18} color="#FF8200" />,
      activeMetrics: 'Automated triage · Zero delay',
      targetTab: 'incidents',
      operationalActions: [
        {
          label: 'VIEW INCIDENT LEDGER',
          action: () => setActiveTab('incidents'),
          isPrimary: true,
        },
        {
          label: 'ACKNOWLEDGE ACTIVE',
          action: () => {
            const openInc = incidents.find((i) => i.status === 'open');
            if (openInc) acknowledgeIncident(openInc.id);
            setActiveTab('incidents');
          },
        },
      ],
    },
    {
      key: 'automate',
      name: 'AUTOMATE',
      tagline: 'IoT Relays & Energy Efficiency',
      subtitle: 'AUTONOMOUS CONTROLS',
      description: 'Autonomous occupancy-driven lighting circuits, variable ventilation dampers, and submeter peak-shaving.',
      icon: <Zap size={18} color="#FF8200" />,
      activeMetrics: '54.00 kW baseline · 6 submeters',
      targetTab: 'energy',
      operationalActions: [
        {
          label: 'ENERGY AUTOMATION',
          action: () => setActiveTab('energy'),
          isPrimary: true,
        },
        {
          label: 'HVAC VENTILATION',
          action: () => setActiveTab('automation'),
        },
      ],
    },
  ];

  return (
    <div
      role="region"
      aria-label="Four System Pillars"
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 2px 12px rgba(16, 24, 32, 0.03)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          backgroundColor: 'var(--color-surface-sunken, #FCFCFD)',
          borderBottom: '1px solid rgba(16, 24, 32, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-slate-gray)',
            }}
          >
            SYSTEM ARCHITECTURE
          </span>
          <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.688rem',
              color: 'var(--color-slate-gray)',
            }}
          >
            FOUR OPERATIONAL CAPABILITIES
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 0,
        }}
      >
        {pillars.map((pillar) => {
          const isSelected = activePillar === pillar.key;

          return (
            <div
              key={pillar.key}
              onClick={() => setActivePillar(isSelected ? null : pillar.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActivePillar(isSelected ? null : pillar.key)}
              style={{
                backgroundColor: isSelected ? 'rgba(255, 130, 0, 0.05)' : 'var(--color-paper-white, #FFFFFF)',
                padding: '22px 24px',
                borderRight: '1px solid rgba(16, 24, 32, 0.08)',
                borderBottom: '1px solid rgba(16, 24, 32, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
            >
              {/* Top Accent line when selected */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: isSelected ? '#FF8200' : 'transparent',
                }}
              />

              <div>
                {/* Header row: Name + Subtitle + Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'rgba(255, 130, 0, 0.12)' : 'rgba(16, 24, 32, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {pillar.icon}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: 'var(--color-ink-black)',
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
                          color: 'var(--color-slate-gray)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {pillar.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowUpRight
                    size={16}
                    color={isSelected ? '#FF8200' : '#8C8C8C'}
                    style={{ transform: isSelected ? 'translate(2px, -2px)' : 'none', transition: 'all 0.18s ease' }}
                  />
                </div>

                {/* Tagline */}
                <div
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: isSelected ? '#FF8200' : 'var(--color-ink-black)',
                    marginBottom: '8px',
                  }}
                >
                  {pillar.tagline}
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-slate-gray)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {pillar.description}
                </p>

                {/* Interactive Capability Actions (Revealed when clicked) */}
                {isSelected && (
                  <div
                    style={{
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.08))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {pillar.operationalActions.map((act) => (
                      <button
                        key={act.label}
                        onClick={act.action}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.688rem',
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 700,
                          backgroundColor: act.isPrimary ? 'var(--color-ink-black)' : 'var(--surface-canvas, #FFFFFF)',
                          color: act.isPrimary ? 'var(--color-paper-white, #FFFFFF)' : 'var(--color-ink-black)',
                          border: act.isPrimary ? 'none' : '1px solid var(--border-subtle, rgba(16, 24, 32, 0.12))',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{act.label}</span>
                        <ChevronRight size={12} color={act.isPrimary ? '#FF8200' : 'var(--color-slate-gray)'} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom active metrics */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.06))',
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.688rem',
                  color: isSelected ? 'var(--color-ink-black)' : 'var(--color-slate-gray)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{pillar.activeMetrics}</span>
                <span style={{ color: '#FF8200', fontWeight: 600 }}>
                  {isSelected ? 'ACTIVE CAPABILITY' : 'SELECT →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
