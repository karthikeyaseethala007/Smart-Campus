import React, { useState } from 'react';
import { Shield, Video, Lock, Radio, ChevronRight } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface ZoneCoverageItem {
  id: string;
  name: string;
  code: string;
  status: 'nominal' | 'warning' | 'critical';
  statusText: string;
  sensorHealth: string;
  cameraState: string;
  accessState: string;
  targetTab: 'monitoring' | 'security' | 'safety';
}

export const SecurityCoverageMatrix: React.FC = () => {
  const { campusStatus, setActiveTab } = useAppState();
  const isEmergency = campusStatus === 'EMERGENCY';

  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const zones: ZoneCoverageItem[] = [
    {
      id: 'ZN-01',
      name: 'MAIN GATE',
      code: 'ZN-PRM-01',
      status: 'nominal',
      statusText: 'NOMINAL',
      sensorHealth: 'PIR Armed · 99% Heartbeat',
      cameraState: 'CAM-01 · LIVE (1080p)',
      accessState: 'Hydraulic Barrier · Locked',
      targetTab: 'security',
    },
    {
      id: 'ZN-02',
      name: 'INNOVATION & ROBOTICS LAB',
      code: 'ZN-ENG-E04',
      status: 'nominal',
      statusText: 'NOMINAL',
      sensorHealth: 'PIR Armed · Modbus Relay Active',
      cameraState: 'CAM-02 · LIVE (1080p)',
      accessState: 'Keypad E-04 · Secured (PIN: 1234)',
      targetTab: 'security',
    },
    {
      id: 'ZN-03',
      name: 'CENTRAL LIBRARY',
      code: 'ZN-LIB-01',
      status: 'nominal',
      statusText: 'NOMINAL',
      sensorHealth: '6 Occupants · Automated HVAC',
      cameraState: 'CAM-04 · LIVE (1080p)',
      accessState: 'South Portal · Auto-Timed Lock',
      targetTab: 'monitoring',
    },
    {
      id: 'ZN-04',
      name: 'SCIENCE & PHYSICS LAB',
      code: 'ZN-SCI-204',
      status: isEmergency ? 'critical' : 'warning',
      statusText: isEmergency ? 'CRITICAL EVACUATION' : 'VENTILATION SUPERVISED',
      sensorHealth: isEmergency ? 'MQ-2 Gas: 840 ppm (ALARM)' : 'MQ-2 Gas: 412 ppm (Purging)',
      cameraState: 'CAM-03 · LIVE (1080p)',
      accessState: 'Door S-204 · Interlock Normal',
      targetTab: 'safety',
    },
    {
      id: 'ZN-05',
      name: 'ACADEMIC HALLWAY',
      code: 'ZN-HLW-W1',
      status: 'nominal',
      statusText: 'NOMINAL',
      sensorHealth: 'PIR Active · 65% Eco Lights',
      cameraState: 'CAM-03 (Corridor Overlay)',
      accessState: 'Unrestricted Passage · Supervised',
      targetTab: 'monitoring',
    },
    {
      id: 'ZN-06',
      name: 'COMPUTER LAB',
      code: 'ZN-CMP-L1',
      status: 'nominal',
      statusText: 'RESOLVED',
      sensorHealth: 'PIR Anomaly Cleared · 20.8°C',
      cameraState: 'Optical Dome 06 · Armed',
      accessState: 'Badge Reader · Locked',
      targetTab: 'safety',
    },
    {
      id: 'ZN-07',
      name: 'DATA CENTER / SERVER ROOM',
      code: 'ZN-ADM-SRV',
      status: 'nominal',
      statusText: 'HIGH SECURITY',
      sensorHealth: 'VESDA Laser Smoke · 100% Ready',
      cameraState: 'Thermal Cam 07 · Armed',
      accessState: 'Biometric Interlock SRV-101 · Locked',
      targetTab: 'security',
    },
  ];

  return (
    <div
      role="region"
      aria-label="Security Coverage Campus Zone Matrix"
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        padding: '28px 32px',
        border: '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#5B6871',
              marginBottom: '4px',
            }}
          >
            <Shield size={13} color="#101820" />
            <span>SECURITY COVERAGE</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
            <span>7 OPERATIONAL ZONES</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: '1.375rem',
              fontWeight: 600,
              color: '#101820',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Campus Zone Matrix
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.688rem', fontFamily: "var(--font-mono, monospace)" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span style={{ color: '#5B6871' }}>6 NOMINAL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isEmergency ? '#FF0000' : '#FF8200' }} />
            <span style={{ color: isEmergency ? '#FF0000' : '#FF8200' }}>
              {isEmergency ? '1 CRITICAL' : '1 SUPERVISED'}
            </span>
          </div>
        </div>
      </div>

      {/* COMPACT CONNECTED OPERATIONAL MATRIX (NOT 7 GIANT CARDS) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(16, 24, 32, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Table/Matrix Column Headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 1.4fr) 110px minmax(180px, 1fr) minmax(160px, 1fr) minmax(180px, 1fr) 36px',
            gap: '12px',
            padding: '12px 20px',
            backgroundColor: '#FCFCFD',
            borderBottom: '1px solid rgba(16, 24, 32, 0.08)',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: '0.625rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8C8C8C',
          }}
        >
          <span>ZONE & LOCATION</span>
          <span>STATUS</span>
          <span>SENSOR HEALTH</span>
          <span>CAMERA FEED</span>
          <span>ACCESS STATE</span>
          <span />
        </div>

        {/* 7 Connected Zone Rows */}
        {zones.map((zone, index) => {
          const isCrit = zone.status === 'critical';
          const isWarn = zone.status === 'warning';
          const isHovered = hoveredZone === zone.id;

          const statusColor = isCrit ? '#FF0000' : isWarn ? '#FF8200' : '#22c55e';
          const statusBg = isCrit
            ? 'rgba(255, 0, 0, 0.08)'
            : isWarn
            ? 'rgba(255, 130, 0, 0.08)'
            : 'rgba(34, 197, 94, 0.08)';

          return (
            <div
              key={zone.id}
              onClick={() => setActiveTab(zone.targetTab)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveTab(zone.targetTab)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 1.4fr) 110px minmax(180px, 1fr) minmax(160px, 1fr) minmax(180px, 1fr) 36px',
                gap: '12px',
                alignItems: 'center',
                padding: '12px 20px',
                borderBottom: index < zones.length - 1 ? '1px solid rgba(16, 24, 32, 0.06)' : 'none',
                backgroundColor: isHovered
                  ? 'rgba(16, 24, 32, 0.02)'
                  : isCrit
                  ? 'rgba(255, 0, 0, 0.02)'
                  : '#FFFFFF',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              {/* Zone Name & Code */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: statusColor,
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display, sans-serif)",
                      fontSize: '0.813rem',
                      fontWeight: 600,
                      color: '#101820',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {zone.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: '0.625rem',
                      color: '#8A8F8D',
                    }}
                  >
                    {zone.code}
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: statusBg,
                    color: statusColor,
                  }}
                >
                  {zone.statusText}
                </span>
              </div>

              {/* Sensor Health */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={12} color="#5B6871" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.75rem',
                    color: isCrit ? '#FF0000' : '#5B6871',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {zone.sensorHealth}
                </span>
              </div>

              {/* Camera State */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Video size={12} color="#101820" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.75rem',
                    color: '#101820',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {zone.cameraState}
                </span>
              </div>

              {/* Access State */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} color="#5B6871" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.75rem',
                    color: '#5B6871',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {zone.accessState}
                </span>
              </div>

              {/* Row Navigation arrow */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ChevronRight
                  size={14}
                  color={isHovered ? '#101820' : '#8C8C8C'}
                  style={{ transform: isHovered ? 'translateX(2px)' : 'none', transition: 'all 0.15s ease' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
