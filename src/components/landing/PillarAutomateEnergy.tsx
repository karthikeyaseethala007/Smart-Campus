import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, UserX, TrendingDown } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const PillarAutomateEnergy: React.FC = () => {
  const { triggerZoneOccupancy, triggerZoneVacancy } = useAppState();
  const [isOccupied, setIsOccupied] = useState<boolean>(false);

  const handleToggle = (occupied: boolean) => {
    setIsOccupied(occupied);
    if (occupied) {
      triggerZoneOccupancy('zone-6', 'simulation');
    } else {
      triggerZoneVacancy('zone-6', 'simulation');
    }
  };

  const currentPowerKw = isOccupied ? 54.85 : 54.00;
  const lightingWatts = isOccupied ? 450 : 0;
  const hvacWatts = isOccupied ? 400 : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'center',
        backgroundColor: 'var(--color-paper-white)',
        borderRadius: '1.5rem',
        padding: '36px',
        border: 'var(--border-hairline)',
        boxShadow: 'var(--shadow-subtle-2)',
      }}
    >
      {/* Left: Interactive Occupancy & Relay Switchboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-sienna-brown)',
              fontWeight: 600,
            }}
          >
            Pillar 04 · AUTOMATE
          </span>
          <span style={{ color: 'var(--color-smoke-gray)' }}>/</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-gray)' }}>
            Zone 06 · Computer Lab 301
          </span>
        </div>

        <h3
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'var(--color-ink-black)',
          }}
        >
          Occupancy-Driven Energy Automation
        </h3>

        <p
          style={{
            fontSize: '0.938rem',
            color: 'var(--color-slate-gray)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          No light burns in an empty hall. PIR sensors detect physical presence, actuating 16A solid-state contactors for lighting and air circulation. On vacancy, a 3-minute grace timer initiates zero-standby shutdown.
        </p>

        {/* Interactive Occupancy Simulation Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleToggle(true)}
            style={{
              padding: '12px 22px',
              borderRadius: '9999px',
              backgroundColor: isOccupied ? '#ff8200' : 'var(--color-primary-100)',
              color: isOccupied ? '#000000' : 'var(--color-ink-black)',
              border: isOccupied ? 'none' : '1px solid var(--border-hairline)',
              fontSize: '0.813rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isOccupied ? '0 4px 16px rgba(255, 130, 0, 0.3)' : 'none',
              transition: 'all 0.16s var(--ease-out)',
            }}
          >
            <Users size={15} />
            <span>Person Enters Lab</span>
          </button>

          <button
            onClick={() => handleToggle(false)}
            style={{
              padding: '12px 22px',
              borderRadius: '9999px',
              backgroundColor: !isOccupied ? 'var(--color-ink-black)' : 'var(--color-primary-100)',
              color: !isOccupied ? '#ffffff' : 'var(--color-ink-black)',
              border: !isOccupied ? 'none' : '1px solid var(--border-hairline)',
              fontSize: '0.813rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.16s var(--ease-out)',
            }}
          >
            <UserX size={15} />
            <span>Vacate / Auto-Cutoff</span>
          </button>
        </div>

        {/* Dual Relay Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginTop: '6px' }}>
          {/* Relay 1: Lighting */}
          <div
            style={{
              padding: '16px',
              borderRadius: '0.75rem',
              backgroundColor: isOccupied ? 'rgba(255, 130, 0, 0.08)' : 'var(--color-fog-white)',
              border: isOccupied ? '1px solid var(--color-sienna-brown)' : 'var(--border-hairline)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Relay 01 · GPIO 18
              </span>
              <span
                style={{
                  fontSize: '0.688rem',
                  fontWeight: 700,
                  color: isOccupied ? '#ff8200' : '#8a8f8d',
                }}
              >
                {isOccupied ? 'CLOSED' : 'OPEN'}
              </span>
            </div>
            <div style={{ fontSize: '0.938rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
              LED Array Lighting
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-gray)', marginTop: '4px' }}>
              {lightingWatts} W Draw
            </div>
          </div>

          {/* Relay 2: HVAC */}
          <div
            style={{
              padding: '16px',
              borderRadius: '0.75rem',
              backgroundColor: isOccupied ? 'rgba(255, 130, 0, 0.08)' : 'var(--color-fog-white)',
              border: isOccupied ? '1px solid var(--color-sienna-brown)' : 'var(--border-hairline)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Relay 02 · GPIO 19
              </span>
              <span
                style={{
                  fontSize: '0.688rem',
                  fontWeight: 700,
                  color: isOccupied ? '#ff8200' : '#8a8f8d',
                }}
              >
                {isOccupied ? 'CLOSED' : 'OPEN'}
              </span>
            </div>
            <div style={{ fontSize: '0.938rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
              Ventilation Contactor
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-gray)', marginTop: '4px' }}>
              {hvacWatts} W Draw
            </div>
          </div>
        </div>
      </div>

      {/* Right: Real-Time Demand Meter & Load Differential */}
      <div
        style={{
          backgroundColor: '#101820',
          borderRadius: '1.25rem',
          padding: '28px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={15} color="#ff8200" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CAMPUS ACTIVE DEMAND
            </span>
          </div>

          <span
            style={{
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: isOccupied ? 'rgba(255, 130, 0, 0.2)' : 'rgba(255,255,255,0.1)',
              color: isOccupied ? '#ff8200' : '#8a8f8d',
              fontSize: '0.688rem',
              fontWeight: 600,
            }}
          >
            {isOccupied ? 'ZONE ACTIVE (+0.85 kW)' : 'IDLE BASELINE'}
          </span>
        </div>

        {/* Big Numerical Demand Output */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <motion.span
            key={currentPowerKw}
            initial={{ opacity: 0.6, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '3.6rem',
              fontWeight: 300,
              color: isOccupied ? '#ff8200' : '#ffffff',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {currentPowerKw.toFixed(2)}
          </motion.span>
          <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            kW
          </span>
        </div>

        {/* Load Distribution Stacked Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
            <span>Sub-Metered Load Distribution</span>
            <span>{isOccupied ? '100% Monitored' : 'Baseline Standby'}</span>
          </div>

          <div
            style={{
              height: '12px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '9999px',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {/* 54 kW Baseline */}
            <div
              style={{
                width: isOccupied ? '98.4%' : '100%',
                backgroundColor: '#5b6871',
                height: '100%',
                transition: 'width 0.3s ease',
              }}
              title="Campus Core Baseline (54.00 kW)"
            />
            {/* Actuated Lab Load */}
            {isOccupied && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '1.6%' }}
                style={{
                  backgroundColor: '#ff8200',
                  height: '100%',
                }}
                title="Room 301 Load (+0.85 kW)"
              />
            )}
          </div>
        </div>

        {/* Efficiency Metric Summary */}
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: '0.75rem',
            padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingDown size={18} color="#22c55e" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Zero-Standby Night Cutoff</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>1,280 kWh conserved monthly</div>
            </div>
          </div>

          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e' }}>
            -14.8%
          </span>
        </div>
      </div>
    </div>
  );
};
