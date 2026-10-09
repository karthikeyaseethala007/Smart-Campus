import React from 'react';
import { Activity, Flame, Radio, Thermometer, Zap, ChevronRight, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface SensorNetworkModuleProps {
  onNavigate?: () => void;
}

export const SensorNetworkModule: React.FC<SensorNetworkModuleProps> = ({ onNavigate }) => {
  const {
    campusStatus,
    automations,
    devices,
    incidents,
    setActiveTab,
    triggerMQ2Elevation,
    resetMQ2Calibration,
    triggerRestrictedMotion,
  } = useAppState();

  const handleOpenSensors = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      setActiveTab('safety');
    }
  };

  const isEmergency = campusStatus === 'EMERGENCY';
  const submeterLoadKw = automations.reduce((sum, z) => sum + z.currentPowerKw, 0);
  const totalDemandKw = (35.0 + submeterLoadKw).toFixed(2);

  // Compute MQ-2 State Machine: NORMAL -> ELEVATED -> CRITICAL
  const gasIncident = incidents.find((i) => i.id === 'INC-GAS-003' && i.status !== 'resolved');
  const isGasElevated = !!gasIncident || isEmergency;
  const isGasCritical = isEmergency || (gasIncident && gasIncident.severity === 'critical');

  const mq2State: 'NORMAL' | 'ELEVATED' | 'CRITICAL' = isGasCritical
    ? 'CRITICAL'
    : isGasElevated
    ? 'ELEVATED'
    : 'NORMAL';

  const mq2Ppm = mq2State === 'CRITICAL' ? 840 : mq2State === 'ELEVATED' ? 640 : 312;
  const mq2Threshold = 500;
  const mq2Trend = mq2State === 'CRITICAL' ? '↗ +42% spike' : mq2State === 'ELEVATED' ? '↗ +28% spike' : '↗ +3.4%';

  const pirCount = devices.filter((d) => d.category === 'motion').length || 42;

  return (
    <div
      role="region"
      aria-label="Sensor Intelligence Network"
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        padding: '24px 28px',
        border: mq2State === 'CRITICAL'
          ? '1px solid rgba(255, 0, 0, 0.4)'
          : mq2State === 'ELEVATED'
          ? '1px solid rgba(255, 130, 0, 0.4)'
          : '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 24, 32, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={14} color="var(--color-ink-black)" />
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-slate-gray)',
              }}
            >
              SENSOR INTELLIGENCE
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenSensors}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#8C8C8C',
            fontSize: '0.75rem',
            fontFamily: "var(--font-mono, monospace)",
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              color: mq2State === 'CRITICAL' ? '#FF0000' : mq2State === 'ELEVATED' ? '#FF8200' : '#22c55e',
              fontWeight: 700,
            }}
          >
            {mq2State === 'CRITICAL' ? 'CRITICAL SPIKE' : mq2State === 'ELEVATED' ? 'ELEVATED THRESHOLD' : 'SUPERVISORY NOMINAL'}
          </span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* 4 Sensor Modalities Grid Visualization */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Sensor 1: MQ-2 Electrochemical Gas (Featured with State Machine & Threshold) */}
        <div
          style={{
            backgroundColor: mq2State === 'CRITICAL'
              ? 'rgba(255, 0, 0, 0.04)'
              : mq2State === 'ELEVATED'
              ? 'rgba(255, 130, 0, 0.04)'
              : '#FCFCFD',
            borderRadius: '10px',
            padding: '14px',
            border: mq2State === 'CRITICAL'
              ? '1px solid rgba(255, 0, 0, 0.35)'
              : mq2State === 'ELEVATED'
              ? '1px solid rgba(255, 130, 0, 0.35)'
              : '1px solid rgba(16, 24, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.688rem',
                fontWeight: 700,
                color: mq2State === 'CRITICAL' ? '#FF0000' : mq2State === 'ELEVATED' ? '#FF8200' : 'var(--color-slate-gray)',
                letterSpacing: '0.06em',
              }}
            >
              MQ-2 CHEMIRESISTOR
            </span>
            <Flame
              size={14}
              color={mq2State === 'CRITICAL' ? '#FF0000' : mq2State === 'ELEVATED' ? '#FF8200' : '#22c55e'}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontFamily: "var(--font-display, sans-serif)",
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: mq2State === 'CRITICAL' ? '#FF0000' : mq2State === 'ELEVATED' ? '#FF8200' : 'var(--color-ink-black)',
                  lineHeight: 1,
                }}
              >
                {mq2Ppm}
              </span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: 'var(--color-slate-gray)' }}>
                ppm
              </span>
            </div>

            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.625rem',
                fontWeight: 700,
                color: mq2State === 'NORMAL' ? '#22c55e' : '#FF8200',
              }}
            >
              {mq2Trend}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', fontFamily: "var(--font-mono, monospace)", color: '#8C8C8C' }}>
            <span>STATE: <strong style={{ color: mq2State === 'CRITICAL' ? '#FF0000' : mq2State === 'ELEVATED' ? '#FF8200' : '#22c55e' }}>{mq2State}</strong></span>
            <span>LIMIT: {mq2Threshold} ppm</span>
          </div>

          {/* Micro Visual Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(16, 24, 32, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.round((mq2Ppm / mq2Threshold) * 100))}%`,
                height: '100%',
                backgroundColor: mq2State === 'CRITICAL' ? '#FF0000' : mq2State === 'ELEVATED' ? '#FF8200' : '#22c55e',
                borderRadius: '2px',
                transition: 'width 0.4s ease, background-color 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Sensor 2: PIR Motion / Occupancy */}
        <div
          style={{
            backgroundColor: '#FCFCFD',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(16, 24, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', fontWeight: 700, color: 'var(--color-slate-gray)', letterSpacing: '0.06em' }}>
              PIR OCCUPANCY
            </span>
            <Radio size={14} color="var(--color-ink-black)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink-black)', lineHeight: 1 }}>
              {pirCount}
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: 'var(--color-slate-gray)' }}>
              Nodes Active
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', fontFamily: "var(--font-mono, monospace)", color: 'var(--color-slate-gray)' }}>
            <span>ZONE: ALL CAMPUS</span>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>ARMED</span>
          </div>

          {/* Micro Visual Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-subtle, rgba(16, 24, 32, 0.06))', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#22c55e', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Sensor 3: Ambient Temperature */}
        <div
          style={{
            backgroundColor: 'var(--color-mist-gray, #FCFCFD)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.06))',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', fontWeight: 700, color: 'var(--color-slate-gray)', letterSpacing: '0.06em' }}>
              TEMPERATURE
            </span>
            <Thermometer size={14} color="var(--color-ink-black)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink-black)', lineHeight: 1 }}>
              21.4°C
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: 'var(--color-slate-gray)' }}>
              Ambient
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', fontFamily: "var(--font-mono, monospace)", color: 'var(--color-slate-gray)' }}>
            <span>TARGET: 21.0°C</span>
            <span style={{ color: '#22c55e' }}>STABLE</span>
          </div>

          {/* Micro Visual Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-subtle, rgba(16, 24, 32, 0.06))', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '70%', height: '100%', backgroundColor: 'var(--color-ink-black)', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Sensor 4: Energy Submeter Load */}
        <div
          style={{
            backgroundColor: 'var(--color-mist-gray, #FCFCFD)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.06))',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', fontWeight: 700, color: 'var(--color-slate-gray)', letterSpacing: '0.06em' }}>
              ENERGY METER
            </span>
            <Zap size={14} color="#FF8200" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink-black)', lineHeight: 1 }}>
              {totalDemandKw}
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: '#FF8200', fontWeight: 600 }}>
              kW Draw
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', fontFamily: "var(--font-mono, monospace)", color: 'var(--color-slate-gray)' }}>
            <span>BASE: 54.0 kW</span>
            <span style={{ color: '#FF8200' }}>+1.57%</span>
          </div>

          {/* Micro Visual Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-subtle, rgba(16, 24, 32, 0.06))', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '56%', height: '100%', backgroundColor: '#FF8200', borderRadius: '2px' }} />
          </div>
        </div>
      </div>

      {/* OPERATIONAL SENSOR INTERACTION CONTROLS (Section 7 Functional Connection) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: '#F7F8F9',
          borderRadius: '8px',
          border: '1px solid rgba(16, 24, 32, 0.06)',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: '0.625rem',
            fontWeight: 700,
            color: 'var(--color-slate-gray)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          TELEMETRY DISPATCH:
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => triggerMQ2Elevation(640)}
            style={{
              padding: '4px 8px',
              fontSize: '0.625rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              backgroundColor: 'var(--surface-canvas, #FFFFFF)',
              border: '1px solid rgba(255, 130, 0, 0.4)',
              color: '#FF8200',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Simulate gas spike beyond 500 ppm safety threshold"
          >
            <AlertTriangle size={11} color="#FF8200" />
            <span>ELEVATE (640 ppm)</span>
          </button>

          <button
            onClick={() => triggerMQ2Elevation(840)}
            style={{
              padding: '4px 8px',
              fontSize: '0.625rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              backgroundColor: 'var(--surface-canvas, #FFFFFF)',
              border: '1px solid rgba(255, 0, 0, 0.4)',
              color: '#FF0000',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Simulate critical gas breach (840 ppm)"
          >
            <Flame size={11} color="#FF0000" />
            <span>CRITICAL (840 ppm)</span>
          </button>

          <button
            onClick={resetMQ2Calibration}
            style={{
              padding: '4px 8px',
              fontSize: '0.625rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              backgroundColor: 'var(--surface-canvas, #FFFFFF)',
              border: '1px solid rgba(16, 24, 32, 0.15)',
              color: 'var(--color-ink-black)',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Recalibrate gas sensor to baseline 312 ppm"
          >
            <RefreshCw size={11} color="var(--color-slate-gray)" />
            <span>RESET (312 ppm)</span>
          </button>

          <button
            onClick={() => triggerRestrictedMotion()}
            style={{
              padding: '4px 8px',
              fontSize: '0.625rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              backgroundColor: 'var(--surface-canvas, #FFFFFF)',
              border: '1px solid rgba(16, 24, 32, 0.15)',
              color: 'var(--color-slate-gray)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Trigger restricted PIR motion sensor"
          >
            PIR TRIP
          </button>
        </div>
      </div>

      {/* Footer Status Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.688rem', fontFamily: "var(--font-mono, monospace)", color: 'var(--color-slate-gray)', paddingTop: '10px', borderTop: '1px solid rgba(16, 24, 32, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={12} color="#22c55e" />
          <span>MODBUS RS485 TELEMETRY LOOP SYNCHRONIZED</span>
        </div>
        <button
          onClick={handleOpenSensors}
          style={{ background: 'none', border: 'none', color: '#FF8200', fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          VIEW SENSORS →
        </button>
      </div>
    </div>
  );
};
