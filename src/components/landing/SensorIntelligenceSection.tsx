import React, { useState } from 'react';
import { Activity, Users, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AnimatedNumber } from '../reactbits/AnimatedNumber';
import { TiltedCard } from '../reactbits/TiltedCard';

export const SensorIntelligenceSection: React.FC = () => {
  const [isOccupied, setIsOccupied] = useState(true);
  const [isGasElevated, setIsGasElevated] = useState(false);
  const [isPeakEnergy, setIsPeakEnergy] = useState(false);

  return (
    <section
      id="sensor-intelligence-section"
      style={{
        position: 'relative',
        backgroundColor: '#0A0E13',
        color: '#FFFFFF',
        padding: 'clamp(80px, 12vh, 160px) clamp(24px, 6vw, 96px)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Section Header */}
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
            <Activity size={14} color="#FF8200" />
            <span>CONTINUOUS ENVIRONMENTAL TELEMETRY</span>
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
            The Campus is Always Listening.
          </h2>

          <p style={{ fontSize: '1rem', color: '#8C9BA5', maxWidth: '640px', lineHeight: 1.6, margin: 0 }}>
            Every chemical vapor, physical occupancy shift, and electrical watt is continuously sampled. Toggle the live sensor states below to witness system response.
          </p>
        </div>

        {/* Sensory Telemetry Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(24px, 3.5vw, 40px)',
          }}
        >
          {/* Card 1: PIR Motion & Spatial Occupancy */}
          <TiltedCard
            maxAngle={6}
            style={{
              backgroundColor: '#111822',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 'clamp(32px, 4vw, 48px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '340px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.688rem',
                    letterSpacing: '0.12em',
                    color: '#8C9BA5',
                  }}
                >
                  PIR MATRIX · ZONE B
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.625rem',
                    color: isOccupied ? '#FF8200' : '#22C55E',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: isOccupied ? 'rgba(255, 130, 0, 0.16)' : 'rgba(34, 197, 94, 0.16)',
                  }}
                >
                  <Users size={12} />
                  {isOccupied ? 'OCCUPIED' : 'UNOCCUPIED'}
                </span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: 'clamp(3rem, 4.5vw, 4.2rem)',
                  fontWeight: 450,
                  letterSpacing: '-0.04em',
                  color: '#FFFFFF',
                  lineHeight: 1,
                  marginBottom: '12px',
                }}
              >
                <AnimatedNumber value={isOccupied ? 42 : 0} suffix=" PERSONS" />
              </div>

              <p style={{ fontSize: '0.875rem', color: '#8C9BA5', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Passive infrared directional array tracking dynamic headcount across robotics labs.
              </p>
            </div>

            <button
              onClick={() => setIsOccupied((prev) => !prev)}
              style={{
                padding: '10px 18px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#FFFFFF',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              TOGGLE: {isOccupied ? 'SIMULATE VACANCY' : 'SIMULATE INGRESS'}
            </button>
          </TiltedCard>

          {/* Card 2: MQ-2 Gas & Smoke Concentration */}
          <TiltedCard
            maxAngle={6}
            style={{
              backgroundColor: isGasElevated ? 'rgba(255, 0, 0, 0.10)' : '#111822',
              borderRadius: '24px',
              border: `1px solid ${isGasElevated ? 'rgba(255, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
              padding: 'clamp(32px, 4vw, 48px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '340px',
              transition: 'all 0.3s ease',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.688rem',
                    letterSpacing: '0.12em',
                    color: '#8C9BA5',
                  }}
                >
                  MQ-2 ELECTROCHEMICAL · LAB 4
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.625rem',
                    color: isGasElevated ? '#FF4D4D' : '#22C55E',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: isGasElevated ? 'rgba(255, 0, 0, 0.2)' : 'rgba(34, 197, 94, 0.16)',
                  }}
                >
                  {isGasElevated ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                  {isGasElevated ? 'CRITICAL HAZARD' : 'NORMAL RANGE'}
                </span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: 'clamp(3rem, 4.5vw, 4.2rem)',
                  fontWeight: 450,
                  letterSpacing: '-0.04em',
                  color: isGasElevated ? '#FF4D4D' : '#FFFFFF',
                  lineHeight: 1,
                  marginBottom: '12px',
                }}
              >
                <AnimatedNumber value={isGasElevated ? 380 : 42} suffix=" PPM" />
              </div>

              <p style={{ fontSize: '0.875rem', color: '#8C9BA5', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Volatile chemical hydrocarbon monitoring. Thresholds above 350 PPM trigger automatic exhaust dampers.
              </p>
            </div>

            <button
              onClick={() => setIsGasElevated((prev) => !prev)}
              style={{
                padding: '10px 18px',
                borderRadius: '9999px',
                border: `1px solid ${isGasElevated ? '#FF0000' : 'rgba(255, 255, 255, 0.15)'}`,
                backgroundColor: isGasElevated ? '#FF0000' : 'rgba(255, 255, 255, 0.06)',
                color: '#FFFFFF',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isGasElevated) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isGasElevated) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
            >
              TOGGLE: {isGasElevated ? 'RESTORE NORMAL 42 PPM' : 'TRIGGER GAS SPIKE 380 PPM'}
            </button>
          </TiltedCard>

          {/* Card 3: Energy Grid Demand & Load Shaving */}
          <TiltedCard
            maxAngle={6}
            style={{
              backgroundColor: '#111822',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 'clamp(32px, 4vw, 48px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '340px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.688rem',
                    letterSpacing: '0.12em',
                    color: '#8C9BA5',
                  }}
                >
                  SMART POWER GRID · BUS-1
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: '0.625rem',
                    color: '#FF8200',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 130, 0, 0.16)',
                  }}
                >
                  <Zap size={12} />
                  SELF-BALANCING
                </span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                  fontSize: 'clamp(3rem, 4.5vw, 4.2rem)',
                  fontWeight: 450,
                  letterSpacing: '-0.04em',
                  color: '#FFFFFF',
                  lineHeight: 1,
                  marginBottom: '12px',
                }}
              >
                <AnimatedNumber value={isPeakEnergy ? 54.85 : 54.00} decimals={2} suffix=" kW" />
              </div>

              <p style={{ fontSize: '0.875rem', color: '#8C9BA5', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Current electrical draw across academic infrastructure. Autonomously shedding non-essential relays.
              </p>
            </div>

            <button
              onClick={() => setIsPeakEnergy((prev) => !prev)}
              style={{
                padding: '10px 18px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#FFFFFF',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              TOGGLE: {isPeakEnergy ? 'LOAD SHED 54.00 kW' : 'SURGE DRAW 54.85 kW'}
            </button>
          </TiltedCard>
        </div>
      </div>
    </section>
  );
};

export default SensorIntelligenceSection;
