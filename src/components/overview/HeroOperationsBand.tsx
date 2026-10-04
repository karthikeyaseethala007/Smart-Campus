import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Flame, Cpu, Zap } from 'lucide-react';
import { AnimatedNumber } from '../reactbits/AnimatedNumber';

interface HeroOperationsBandProps {
  systemHealthPct: number;
  lockedDoorsCount: number;
  totalDoorsCount: number;
  onlineDevicesCount: number;
  totalDevicesCount: number;
  totalDemandKw: string;
  isEmergency: boolean;
}

export const HeroOperationsBand: React.FC<HeroOperationsBandProps> = ({
  systemHealthPct,
  lockedDoorsCount,
  totalDoorsCount,
  onlineDevicesCount,
  totalDevicesCount,
  totalDemandKw,
  isEmergency,
}) => {
  return (
    <section
      aria-label="Campus Command Center Hero Operations"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '32px',
        padding: '36px 40px',
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle industrial architectural background accent gridline */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: isEmergency ? '#FF0000' : '#FF8200',
        }}
      />

      {/* LEFT: Large Title & Supporting Statement */}
      <div style={{ maxWidth: '640px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: '0.688rem',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#5B6871',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isEmergency ? '#FF0000' : '#22c55e',
              boxShadow: isEmergency ? '0 0 8px #FF0000' : '0 0 8px #22c55e',
            }}
          />
          <span>OPERATIONAL MATRIX · SOC LEVEL 4</span>
          <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
          <span>CAMPUS WIDE TELEMETRY</span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display, 'Outfit', 'Plus Jakarta Sans', sans-serif)",
            fontSize: 'clamp(2.2rem, 3.6vw, 3.4rem)',
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            color: '#101820',
            margin: '0 0 16px 0',
          }}
        >
          CAMPUS
          <br />
          <span style={{ color: '#5B6871', fontWeight: 500 }}>COMMAND CENTER</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(0.938rem, 1.1vw, 1.05rem)',
            color: '#5B6871',
            lineHeight: 1.55,
            margin: 0,
            maxWidth: '520px',
            fontWeight: 400,
          }}
        >
          One operational view across security, safety, surveillance, sensors, energy and response.
        </p>
      </div>

      {/* RIGHT: Live System Status & Micro Telemetry Indicators */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '24px',
          minWidth: '280px',
        }}
      >
        {/* Large Health KPI */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#8C8C8C',
              marginBottom: '6px',
            }}
          >
            LIVE SYSTEM STATUS
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span
              style={{
                fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                fontSize: 'clamp(3rem, 4.4vw, 4.2rem)',
                fontWeight: 600,
                color: '#101820',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              <AnimatedNumber value={systemHealthPct} decimals={1} suffix="%" />
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 12px rgba(34, 197, 94, 0.65)',
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#101820',
                }}
              >
                SYSTEM HEALTH
              </span>
            </div>
          </div>
        </div>

        {/* 4 Discrete Small Status Indicators */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px 24px',
            width: '100%',
            paddingTop: '16px',
            borderTop: '1px solid rgba(16, 24, 32, 0.06)',
          }}
        >
          {/* Security */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} color="#5B6871" />
            <div style={{ fontSize: '0.75rem', color: '#101820', fontWeight: 500 }}>
              <span style={{ color: '#5B6871' }}>Security: </span>
              <strong style={{ fontWeight: 600 }}>{lockedDoorsCount}/{totalDoorsCount} Locked</strong>
            </div>
          </div>

          {/* Safety */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={14} color={isEmergency ? '#FF0000' : '#22c55e'} />
            <div style={{ fontSize: '0.75rem', color: '#101820', fontWeight: 500 }}>
              <span style={{ color: '#5B6871' }}>Safety: </span>
              <strong style={{ fontWeight: 600, color: isEmergency ? '#FF0000' : '#101820' }}>
                {isEmergency ? 'Critical Alarms' : 'Armed · 412 ppm'}
              </strong>
            </div>
          </div>

          {/* IoT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={14} color="#5B6871" />
            <div style={{ fontSize: '0.75rem', color: '#101820', fontWeight: 500 }}>
              <span style={{ color: '#5B6871' }}>IoT Fleet: </span>
              <strong style={{ fontWeight: 600 }}>{onlineDevicesCount}/{totalDevicesCount} Online</strong>
            </div>
          </div>

          {/* Energy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} color="#FF8200" />
            <div style={{ fontSize: '0.75rem', color: '#101820', fontWeight: 500 }}>
              <span style={{ color: '#5B6871' }}>Energy: </span>
              <strong style={{ fontWeight: 600 }}>{totalDemandKw} kW Load</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
