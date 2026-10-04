import React from 'react';
import { X, Cpu, Wifi, WifiOff, Battery, MapPin, Activity, Terminal } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const DeviceDetailModal: React.FC = () => {
  const { selectedDevice, setSelectedDevice, devices, toggleDeviceOnline, addToast } = useAppState();

  if (!selectedDevice) return null;

  const activeDevice = devices.find(d => d.id === selectedDevice.id) || selectedDevice;

  const handlePingTest = () => {
    addToast('Diagnostics Initiated', `Sending echo to ${activeDevice.ipAddress} (${activeDevice.name}). Round-trip latency: 14ms.`, 'info');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 25, 28, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="floating-artifact"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: 0,
          borderRadius: 'var(--radius-cards)',
          boxShadow: 'var(--shadow-subtle-2)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-paper-white)'
        }}
      >
        <div 
          style={{
            padding: '24px 32px',
            backgroundColor: 'var(--color-mist-gray)',
            borderBottom: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-paper-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-ink-black)'
              }}
            >
              <Cpu size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-signifier)', fontSize: '20px', fontWeight: 400, color: 'var(--color-ink-black)' }}>
                  {activeDevice.name}
                </h3>
                <span 
                  className={`pill-badge ${activeDevice.status === 'online' ? 'pill-badge-neutral' : 'pill-badge-peach'}`} 
                  style={{ fontSize: '12px' }}
                >
                  {activeDevice.status.toUpperCase()}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-slate-gray)' }}>
                {activeDevice.id} · {activeDevice.category}
              </span>
            </div>
          </div>

          <button 
            onClick={() => setSelectedDevice(null)}
            aria-label="Close modal"
            style={{ color: 'var(--color-slate-gray)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              padding: '16px',
              backgroundColor: 'var(--color-mist-gray)',
              borderRadius: 'var(--radius-smallcards)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={16} color="var(--color-ink-black)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Location</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                  {activeDevice.location}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeDevice.status === 'online' ? (
                <Wifi size={16} color="var(--color-ink-black)" />
              ) : (
                <WifiOff size={16} color="var(--color-sienna-brown)" />
              )}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Signal Quality</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: activeDevice.status === 'online' ? 'var(--color-ink-black)' : 'var(--color-sienna-brown)' }}>
                  {activeDevice.status === 'online' ? `${activeDevice.signalStrength}% RSSI` : 'Disconnected'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Battery size={16} color="var(--color-ink-black)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Battery Level</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                  {activeDevice.batteryPct !== undefined ? `${activeDevice.batteryPct}%` : 'Hardwired'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={16} color="var(--color-ink-black)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>Heartbeat Ping</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                  {activeDevice.lastUpdated}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-slate-gray)' }}>IP Address</span>
              <strong style={{ color: 'var(--color-ink-black)', fontFamily: 'monospace' }}>{activeDevice.ipAddress}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-slate-gray)' }}>Firmware</span>
              <strong style={{ color: 'var(--color-ink-black)', fontFamily: 'monospace' }}>{activeDevice.firmware}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-slate-gray)' }}>Zone Allocation</span>
              <strong style={{ color: 'var(--color-ink-black)' }}>{activeDevice.zone}</strong>
            </div>
          </div>
        </div>

        <div 
          style={{
            padding: '20px 32px',
            backgroundColor: 'var(--color-mist-gray)',
            borderTop: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePingTest}
              className="pill-btn-ghost"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <Terminal size={14} />
              <span>Diagnostic Echo</span>
            </button>

            <button
              onClick={() => toggleDeviceOnline(activeDevice.id)}
              className="pill-btn-ghost"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                color: activeDevice.status === 'online' ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)',
                borderColor: activeDevice.status === 'online' ? 'rgba(93, 42, 26, 0.2)' : 'rgba(23, 25, 28, 0.2)'
              }}
            >
              {activeDevice.status === 'online' ? <WifiOff size={14} /> : <Wifi size={14} />}
              <span>{activeDevice.status === 'online' ? 'Simulate Offline' : 'Restore Telemetry'}</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedDevice(null)}
            className="pill-btn-filled"
            style={{ padding: '8px 24px', fontSize: '13px' }}
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
