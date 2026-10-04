import React from 'react';
import { Activity, Flame, Radio, Thermometer, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface SensorNetworkModuleProps {
  onNavigate?: () => void;
}

export const SensorNetworkModule: React.FC<SensorNetworkModuleProps> = ({ onNavigate }) => {
  const { campusStatus, automations, devices, setActiveTab } = useAppState();

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

  const pirCount = devices.filter((d) => d.category === 'motion').length || 42;
  const gasReading = isEmergency ? 840 : 412;

  return (
    <div
      onClick={handleOpenSensors}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleOpenSensors()}
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        padding: '24px 28px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 28px -4px rgba(16, 24, 32, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(16, 24, 32, 0.04)';
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
            <Activity size={14} color="#101820" />
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5B6871',
              }}
            >
              SENSOR NETWORK
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8C8C8C', fontSize: '0.75rem', fontFamily: "var(--font-mono, monospace)" }}>
          <span style={{ color: isEmergency ? '#FF0000' : '#22c55e', fontWeight: 600 }}>
            {isEmergency ? 'ALARM THRESHOLD' : 'SUPERVISORY NOMINAL'}
          </span>
          <ChevronRight size={13} />
        </div>
      </div>

      {/* 4 Sensor Modalities Grid Visualization (NOT A TABLE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        {/* Sensor 1: PIR */}
        <div
          style={{
            backgroundColor: '#FCFCFD',
            borderRadius: '10px',
            padding: '12px 14px',
            border: '1px solid rgba(16, 24, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', fontWeight: 700, color: '#5B6871', letterSpacing: '0.06em' }}>
              PIR OCCUPANCY
            </span>
            <Radio size={12} color="#101820" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.25rem', fontWeight: 700, color: '#101820', lineHeight: 1 }}>
              {pirCount}
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: '#5B6871' }}>
              Nodes Active
            </span>
          </div>

          {/* Micro Visual Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(16, 24, 32, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#22c55e', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Sensor 2: MQ-2 Gas / Air Quality */}
        <div
          style={{
            backgroundColor: isEmergency ? 'rgba(255, 0, 0, 0.04)' : '#FCFCFD',
            borderRadius: '10px',
            padding: '12px 14px',
            border: isEmergency ? '1px solid rgba(255, 0, 0, 0.3)' : '1px solid rgba(16, 24, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', fontWeight: 700, color: isEmergency ? '#FF0000' : '#5B6871', letterSpacing: '0.06em' }}>
              MQ-2 OPTICAL
            </span>
            <Flame size={12} color={isEmergency ? '#FF0000' : '#22c55e'} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.25rem', fontWeight: 700, color: isEmergency ? '#FF0000' : '#101820', lineHeight: 1 }}>
              {gasReading}
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: isEmergency ? '#FF0000' : '#5B6871' }}>
              ppm (air)
            </span>
          </div>

          {/* Micro Visual Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(16, 24, 32, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: isEmergency ? '92%' : '41%',
                height: '100%',
                backgroundColor: isEmergency ? '#FF0000' : '#22c55e',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>

        {/* Sensor 3: Temperature */}
        <div
          style={{
            backgroundColor: '#FCFCFD',
            borderRadius: '10px',
            padding: '12px 14px',
            border: '1px solid rgba(16, 24, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', fontWeight: 700, color: '#5B6871', letterSpacing: '0.06em' }}>
              TEMPERATURE
            </span>
            <Thermometer size={12} color="#101820" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.25rem', fontWeight: 700, color: '#101820', lineHeight: 1 }}>
              21.4°C
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: '#5B6871' }}>
              Ambient Setpoint
            </span>
          </div>

          {/* Micro Visual Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(16, 24, 32, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '68%', height: '100%', backgroundColor: '#101820', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Sensor 4: Energy Demand */}
        <div
          style={{
            backgroundColor: '#FCFCFD',
            borderRadius: '10px',
            padding: '12px 14px',
            border: '1px solid rgba(16, 24, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', fontWeight: 700, color: '#5B6871', letterSpacing: '0.06em' }}>
              ENERGY METER
            </span>
            <Zap size={12} color="#FF8200" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.25rem', fontWeight: 700, color: '#101820', lineHeight: 1 }}>
              {totalDemandKw}
            </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: '#FF8200', fontWeight: 600 }}>
              kW Draw
            </span>
          </div>

          {/* Micro Visual Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(16, 24, 32, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '55%', height: '100%', backgroundColor: '#FF8200', borderRadius: '2px' }} />
          </div>
        </div>
      </div>

      {/* Footer Status Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.688rem', fontFamily: "var(--font-mono, monospace)", color: '#5B6871', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(16, 24, 32, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={12} color="#22c55e" />
          <span>MODBUS RS485 TELEMETRY LOOP SYNCHRONIZED</span>
        </div>
        <span style={{ color: '#FF8200', fontWeight: 600 }}>VIEW SENSORS →</span>
      </div>
    </div>
  );
};
