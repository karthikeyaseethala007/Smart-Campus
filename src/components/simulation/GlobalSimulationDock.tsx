import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Flame, 
  KeyRound, 
  Users, 
  UserX, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const GlobalSimulationDock: React.FC = () => {
  const { 
    isSimulationActive, 
    activeSimulations, 
    simulateFire, 
    simulateSmoke, 
    simulateRestrictedMotion, 
    resetSimulation, 
    triggerZoneOccupancy, 
    triggerZoneVacancy,
    submitKeypadPin,
    canRunSimulations
  } = useAppState();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '28px',
        zIndex: 999,
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              backgroundColor: 'rgba(16, 24, 32, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '1.25rem',
              padding: '20px',
              boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              marginBottom: '12px',
              width: '380px',
              maxWidth: 'calc(100vw - 48px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} color="#ff8200" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Hardware Simulation Bus
                </span>
              </div>

              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: isSimulationActive ? 'rgba(255, 130, 0, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  color: isSimulationActive ? '#ff8200' : '#8a8f8d',
                  fontWeight: 600,
                }}
              >
                {isSimulationActive ? 'SIMULATION ACTIVE' : 'IDLE'}
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0, lineHeight: 1.4 }}>
              Inject controlled scenario telemetry across all campus subsystems to verify state synchronization in real time.
            </p>

            {/* Quick Action Matrix (8 Scenario Buttons) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {/* 1. Simulate Motion */}
              <button
                onClick={simulateRestrictedMotion}
                disabled={!canRunSimulations || activeSimulations.restrictedMotion}
                className="sim-dock-btn"
                style={{
                  padding: '9px 12px',
                  borderRadius: '0.625rem',
                  backgroundColor: activeSimulations.restrictedMotion ? 'rgba(255, 130, 0, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  border: activeSimulations.restrictedMotion ? '1px solid #ff8200' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Radio size={13} color="#ff8200" />
                <span>PIR Motion</span>
              </button>

              {/* 2. Simulate Smoke */}
              <button
                onClick={simulateSmoke}
                disabled={!canRunSimulations || activeSimulations.smoke}
                className="sim-dock-btn"
                style={{
                  padding: '9px 12px',
                  borderRadius: '0.625rem',
                  backgroundColor: activeSimulations.smoke ? 'rgba(255, 130, 0, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  border: activeSimulations.smoke ? '1px solid #ff8200' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Radio size={13} color="#ff8200" />
                <span>MQ-2 Smoke</span>
              </button>

              {/* 3. Valid PIN */}
              <button
                onClick={() => submitKeypadPin('door-2', '1234', 'simulation')}
                disabled={!canRunSimulations}
                className="sim-dock-btn"
                style={{
                  padding: '9px 12px',
                  borderRadius: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <KeyRound size={13} color="#22c55e" />
                <span>Valid PIN (1234)</span>
              </button>

              {/* 4. Invalid PIN */}
              <button
                onClick={() => submitKeypadPin('door-2', '9999', 'simulation')}
                disabled={!canRunSimulations}
                className="sim-dock-btn"
                style={{
                  padding: '9px 12px',
                  borderRadius: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <ShieldAlert size={13} color="#ff0000" />
                <span>Invalid PIN (9999)</span>
              </button>

              {/* 5. Enter Room */}
              <button
                onClick={() => triggerZoneOccupancy('zone-6', 'simulation')}
                disabled={!canRunSimulations}
                className="sim-dock-btn"
                style={{
                  padding: '9px 12px',
                  borderRadius: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Users size={13} color="#ff8200" />
                <span>Enter Room 301</span>
              </button>

              {/* 6. Leave Room */}
              <button
                onClick={() => triggerZoneVacancy('zone-6', 'simulation')}
                disabled={!canRunSimulations}
                className="sim-dock-btn"
                style={{
                  padding: '9px 12px',
                  borderRadius: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <UserX size={13} color="#8a8f8d" />
                <span>Leave Room 301</span>
              </button>

              {/* 7. Fire Emergency */}
              <button
                onClick={simulateFire}
                disabled={!canRunSimulations || activeSimulations.fire}
                className="sim-dock-btn"
                style={{
                  padding: '9px 12px',
                  borderRadius: '0.625rem',
                  backgroundColor: activeSimulations.fire ? '#ff0000' : 'rgba(255, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 0, 0, 0.4)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Flame size={13} color="#ffffff" />
                <span>Fire Emergency</span>
              </button>

              {/* 8. Reset All */}
              <button
                onClick={resetSimulation}
                disabled={!canRunSimulations || !isSimulationActive}
                className="sim-dock-btn"
                style={{
                  padding: '9px 12px',
                  borderRadius: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSimulationActive ? '#ff8200' : '#8a8f8d',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: isSimulationActive ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={13} />
                <span>Reset All</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 20px',
          borderRadius: '9999px',
          backgroundColor: isSimulationActive ? '#ff8200' : '#101820',
          color: isSimulationActive ? '#000000' : '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          transition: 'all 0.2s var(--ease-out)',
        }}
      >
        <Sparkles size={14} />
        <span>{isSimulationActive ? 'Simulation Active' : 'Simulation Dock'}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  );
};
