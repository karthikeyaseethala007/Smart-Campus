import React, { useState } from 'react';
import { Shield, Video, Lock, Radio, ChevronRight, Crosshair } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface ZoneCoverageItem {
  id: string;
  name: string;
  code: string;
  cameraId: string;
  status: 'nominal' | 'warning' | 'critical';
  statusText: string;
  sensorHealth: string;
  cameraState: string;
  accessState: string;
  targetTab: 'monitoring' | 'security' | 'safety' | 'incidents';
}

export const SecurityCoverageMatrix: React.FC = () => {
  const {
    campusStatus,
    selectedZone,
    setSelectedZone,
    setSelectedCameraId,
    incidents,
  } = useAppState();

  const isEmergency = campusStatus === 'EMERGENCY';
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Check live incidents to dynamically determine zone statuses
  const gasIncident = incidents.find((i) => i.id === 'INC-GAS-003' && i.status !== 'resolved');
  const breachIncident = incidents.find((i) => i.id === 'INC-SEC-001' && i.status !== 'resolved');

  const zones: ZoneCoverageItem[] = [
    {
      id: 'ZN-01',
      name: 'Main Gate',
      code: 'ZN-PRM-01',
      cameraId: 'CAM-01',
      status: 'nominal',
      statusText: 'NOMINAL',
      sensorHealth: 'PIR Armed · 99% Heartbeat',
      cameraState: 'CAM-01 · LIVE (1080p)',
      accessState: 'Hydraulic Barrier · Locked',
      targetTab: 'monitoring',
    },
    {
      id: 'ZN-02',
      name: 'Innovation & Robotics Lab',
      code: 'ZN-ENG-E04',
      cameraId: 'CAM-02',
      status: 'nominal',
      statusText: 'NOMINAL',
      sensorHealth: 'PIR Armed · Modbus Relay Active',
      cameraState: 'CAM-02 · LIVE (1080p)',
      accessState: 'Keypad E-04 · Secured (PIN: 4821)',
      targetTab: 'security',
    },
    {
      id: 'ZN-03',
      name: 'Central Library',
      code: 'ZN-LIB-01',
      cameraId: 'CAM-04',
      status: 'nominal',
      statusText: 'NOMINAL',
      sensorHealth: '6 Occupants · Automated HVAC',
      cameraState: 'CAM-04 · LIVE (1080p)',
      accessState: 'South Portal · Auto-Timed Lock',
      targetTab: 'monitoring',
    },
    {
      id: 'ZN-04',
      name: 'Science & Physics Lab',
      code: 'ZN-SCI-204',
      cameraId: 'CAM-03',
      status: isEmergency || gasIncident ? 'critical' : 'warning',
      statusText: isEmergency || gasIncident ? 'HAZARD ELEVATED' : 'NOMINAL BASELINE',
      sensorHealth: isEmergency || gasIncident ? 'MQ-2 Gas: Elevated (ALARM)' : 'MQ-2 Gas: 312 ppm (Nominal)',
      cameraState: 'CAM-03 · LIVE (1080p)',
      accessState: 'Door S-204 · Damper Isolation Ready',
      targetTab: 'safety',
    },
    {
      id: 'ZN-05',
      name: 'Academic Hallway',
      code: 'ZN-HLW-W1',
      cameraId: 'CAM-05',
      status: 'nominal',
      statusText: 'NOMINAL',
      sensorHealth: 'PIR Active · 65% Eco Lights',
      cameraState: 'CAM-05 · LIVE (1080p)',
      accessState: 'Unrestricted Passage · Supervised',
      targetTab: 'monitoring',
    },
    {
      id: 'ZN-06',
      name: 'Computer Lab',
      code: 'ZN-CMP-L1',
      cameraId: 'CAM-06',
      status: 'nominal',
      statusText: 'RESOLVED',
      sensorHealth: 'PIR Anomaly Cleared · 20.8°C',
      cameraState: 'CAM-06 · LIVE (1080p)',
      accessState: 'Badge Reader · Locked',
      targetTab: 'safety',
    },
    {
      id: 'ZN-07',
      name: 'Data Center / Server Room',
      code: 'ZN-ADM-SRV',
      cameraId: 'CAM-07',
      status: breachIncident ? 'critical' : 'nominal',
      statusText: breachIncident ? 'BREACH ALERT' : 'HIGH SECURITY',
      sensorHealth: 'VESDA Laser Smoke · 100% Ready',
      cameraState: 'CAM-07 · LIVE (1080p)',
      accessState: 'Biometric Keypad · Locked (PIN: 1234)',
      targetTab: 'security',
    },
  ];

  const handleSelectZone = (zone: ZoneCoverageItem) => {
    setSelectedZone(zone.name);
    setSelectedCameraId(zone.cameraId);
  };

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
              color: 'var(--color-slate-gray)',
              marginBottom: '4px',
            }}
          >
            <Shield size={13} color="var(--color-ink-black)" />
            <span>CAMPUS ZONES & SPATIAL MATRIX</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>·</span>
            <span>7 OPERATIONAL NODES</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: '1.375rem',
              fontWeight: 600,
              color: 'var(--color-ink-black)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Spatial Security Matrix
          </h2>
        </div>

        {/* Selected Zone Pill / Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 130, 0, 0.08)',
              border: '1px solid rgba(255, 130, 0, 0.25)',
              color: '#FF8200',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.688rem',
              fontWeight: 700,
            }}
          >
            <Crosshair size={12} color="#FF8200" />
            <span>SPATIAL FOCUS: {selectedZone.toUpperCase()}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.688rem', fontFamily: "var(--font-mono, monospace)" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ color: 'var(--color-slate-gray)' }}>6 NOMINAL</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isEmergency || gasIncident ? '#FF0000' : '#FF8200',
                }}
              />
              <span style={{ color: isEmergency || gasIncident ? '#FF0000' : '#FF8200' }}>
                {isEmergency || gasIncident ? '1 ELEVATED' : '1 SUPERVISED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Connected Zone Rows */}
      <div className="table-responsive-wrapper custom-scrollbar">
        <div
          style={{
            minWidth: '820px',
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

        {zones.map((zone, index) => {
          const isSelected = selectedZone.toLowerCase().includes(zone.name.toLowerCase()) || zone.name.toLowerCase().includes(selectedZone.toLowerCase());
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
              onClick={() => handleSelectZone(zone)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectZone(zone)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 1.4fr) 110px minmax(180px, 1fr) minmax(160px, 1fr) minmax(180px, 1fr) 36px',
                gap: '12px',
                alignItems: 'center',
                padding: '12px 20px',
                borderBottom: index < zones.length - 1 ? '1px solid rgba(16, 24, 32, 0.06)' : 'none',
                backgroundColor: isSelected
                  ? 'rgba(255, 130, 0, 0.04)'
                  : isHovered
                  ? 'rgba(16, 24, 32, 0.02)'
                  : isCrit
                  ? 'rgba(255, 0, 0, 0.02)'
                  : '#FFFFFF',
                borderLeft: isSelected ? '3px solid #FF8200' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={`Click to focus Command Center on ${zone.name}`}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display, sans-serif)",
                        fontSize: '0.813rem',
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? '#FF8200' : 'var(--color-ink-black)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {zone.name}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '0.563rem',
                          fontFamily: "var(--font-mono, monospace)",
                          padding: '1px 4px',
                          backgroundColor: '#FF8200',
                          color: '#FFFFFF',
                          borderRadius: '2px',
                          fontWeight: 700,
                        }}
                      >
                        FOCUS
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: '0.625rem',
                      color: '#8C8C8C',
                    }}
                  >
                    {zone.code} · {zone.cameraId}
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
                <Radio size={12} color="var(--color-slate-gray)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.75rem',
                    color: isCrit ? '#FF0000' : 'var(--color-slate-gray)',
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
                <Video size={12} color="var(--color-ink-black)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.75rem',
                    color: 'var(--color-ink-black)',
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
                <Lock size={12} color="var(--color-slate-gray)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.75rem',
                    color: 'var(--color-slate-gray)',
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
                  color={isSelected ? '#FF8200' : isHovered ? 'var(--color-ink-black)' : '#8C8C8C'}
                  style={{ transform: isHovered || isSelected ? 'translateX(2px)' : 'none', transition: 'all 0.15s ease' }}
                />
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
