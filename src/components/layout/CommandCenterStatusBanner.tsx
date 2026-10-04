import React from 'react';
import { useAppState } from '../../services/stateContext';

export const CommandCenterStatusBanner: React.FC = () => {
  const { campusStatus, devices, cameras, incidents, automations, isSimulationActive } = useAppState();

  const isEmergency = campusStatus === 'EMERGENCY';
  const cameraCount = cameras.length;
  const deviceCount = devices.length;
  const criticalCount = incidents.filter((i) => i.status === 'open' && i.severity === 'critical').length;
  const submeterKw = automations.reduce((sum, a) => sum + a.currentPowerKw, 0);
  const totalKw = (35.0 + submeterKw).toFixed(2);

  return (
    <div
      className="top-status-banner"
      style={{
        backgroundColor: isEmergency ? '#ff0000' : '#101820',
        color: '#ffffff',
        fontSize: '0.688rem',
        fontFamily: 'monospace',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 110,
        position: 'sticky',
        top: 0,
        transition: 'background-color 0.3s var(--ease-out)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isEmergency ? '#ffffff' : '#22c55e',
              boxShadow: isEmergency ? '0 0 8px #ffffff' : '0 0 8px #22c55e',
            }}
          />
          <span style={{ fontWeight: 700 }}>
            {isEmergency ? 'CRITICAL EVACUATION' : 'SYSTEM OPERATIONAL'}
          </span>
        </div>

        <span style={{ opacity: 0.3 }}>·</span>
        <span>{cameraCount} CAMERAS</span>

        <span className="banner-secondary-item" style={{ opacity: 0.3 }}>·</span>
        <span className="banner-secondary-item">{deviceCount} IoT DEVICES</span>

        <span style={{ opacity: 0.3 }}>·</span>
        <span style={{ color: criticalCount > 0 ? (isEmergency ? '#ffffff' : '#ff8200') : 'inherit' }}>
          {criticalCount} CRITICAL
        </span>

        <span className="banner-secondary-item" style={{ opacity: 0.3 }}>·</span>
        <span className="banner-secondary-item">{totalKw} kW DEMAND</span>
      </div>

      <div className="banner-secondary-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.625rem',
            color: '#ffffff',
            fontWeight: 600,
          }}
        >
          {isSimulationActive ? 'SIMULATED TELEMETRY ACTIVE' : 'SIMULATED TELEMETRY'}
        </span>
      </div>
    </div>
  );
};
