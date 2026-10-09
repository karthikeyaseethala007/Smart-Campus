import React from 'react';
import { Video, Lock, Radio, Flame, Zap, Cpu } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const LiveOperationalStrip: React.FC = () => {
  const {
    campusStatus,
    cameras,
    doors,
    devices,
    automations,
    incidents,
    setActiveTab,
    setSelectedZone
  } = useAppState();

  const isEmergency = campusStatus === 'EMERGENCY';

  // 1. CCTV Signal
  const totalCams = cameras.length;
  const offlineCams = cameras.filter(c => c.status === 'offline').length;
  const cctvStatus = offlineCams > 0 ? (offlineCams === totalCams ? 'OFFLINE' : 'DEGRADED') : 'ONLINE';
  const cctvColor = offlineCams > 0 ? '#FF8200' : '#22c55e';

  // 2. Access Control Signal
  const totalDoors = doors.length;
  const lockedDoors = doors.filter(d => d.lockStatus === 'locked').length;
  const alertDoors = doors.filter(d => d.isSecurityAlert).length;
  const accessStatus = alertDoors > 0 ? 'ALERT' : lockedDoors === totalDoors ? 'SECURE' : 'UNLOCKED';
  const accessColor = alertDoors > 0 ? '#FF0000' : '#22c55e';

  // 3. PIR Signal
  const pirAnomaly = incidents.some(i => i.status !== 'resolved' && i.event.toLowerCase().includes('restricted'));
  const pirStatus = pirAnomaly ? 'ELEVATED' : 'NORMAL';
  const pirColor = pirAnomaly ? '#FF8200' : '#22c55e';

  // 4. MQ-2 Signal
  const gasIncident = incidents.find(i => i.status !== 'resolved' && (i.event.toLowerCase().includes('gas') || i.event.toLowerCase().includes('smoke')));
  const mq2Status = gasIncident ? (gasIncident.severity === 'critical' ? 'CRITICAL' : 'ELEVATED') : (isEmergency ? 'CRITICAL' : 'NORMAL');
  const mq2Color = mq2Status === 'CRITICAL' ? '#FF0000' : mq2Status === 'ELEVATED' ? '#FF8200' : '#22c55e';
  const mq2Ppm = mq2Status === 'CRITICAL' ? '840 ppm' : mq2Status === 'ELEVATED' ? '640 ppm' : '312 ppm';

  // 5. Energy Signal
  const submeterLoadKw = automations.reduce((sum, z) => sum + z.currentPowerKw, 0);
  const totalDemandKw = (35.0 + submeterLoadKw).toFixed(2);

  // 6. IoT Signal
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const iotStatus = `${onlineDevices} ONLINE`;
  const iotColor = onlineDevices === totalDevices ? '#22c55e' : '#FF8200';

  const signals = [
    {
      id: 'sig-cctv',
      icon: <Video size={13} color="var(--color-ink-black)" />,
      label: 'CCTV',
      value: cctvStatus,
      detail: `${totalCams} Nodes Active`,
      statusColor: cctvColor,
      onClick: () => setActiveTab('monitoring')
    },
    {
      id: 'sig-access',
      icon: <Lock size={13} color="var(--color-ink-black)" />,
      label: 'ACCESS',
      value: accessStatus,
      detail: `${lockedDoors}/${totalDoors} Armed`,
      statusColor: accessColor,
      onClick: () => setActiveTab('security')
    },
    {
      id: 'sig-pir',
      icon: <Radio size={13} color="var(--color-ink-black)" />,
      label: 'PIR',
      value: pirStatus,
      detail: '42 Array Nodes',
      statusColor: pirColor,
      onClick: () => setActiveTab('safety')
    },
    {
      id: 'sig-mq2',
      icon: <Flame size={13} color={mq2Status === 'NORMAL' ? 'var(--color-ink-black)' : '#FF8200'} />,
      label: 'MQ-2',
      value: mq2Status,
      detail: mq2Ppm,
      statusColor: mq2Color,
      onClick: () => {
        setSelectedZone('Science & Physics Lab');
        setActiveTab('safety');
      }
    },
    {
      id: 'sig-energy',
      icon: <Zap size={13} color="#FF8200" />,
      label: 'ENERGY',
      value: `${totalDemandKw} kW`,
      detail: 'Nominal 54.00 kW',
      statusColor: '#22c55e',
      onClick: () => setActiveTab('energy')
    },
    {
      id: 'sig-iot',
      icon: <Cpu size={13} color="var(--color-ink-black)" />,
      label: 'IoT',
      value: iotStatus,
      detail: `${totalDevices - onlineDevices} Faults`,
      statusColor: iotColor,
      onClick: () => setActiveTab('devices')
    }
  ];

  return (
    <nav
      aria-label="Live Operational Telemetry Strip"
      className="live-operational-nav"
    >
      {signals.map((sig) => (
        <div
          key={sig.id}
          onClick={sig.onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && sig.onClick()}
          className="live-operational-item"
        >
          {/* Left: Icon & Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface-sunken)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {sig.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-slate-gray)'
                }}
              >
                {sig.label}
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: "var(--font-mono, monospace)",
                  color: 'var(--color-slate-gray)',
                  marginTop: '1px'
                }}
              >
                {sig.detail}
              </span>
            </div>
          </div>

          {/* Right: Status Value & Dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.75rem',
                fontWeight: 700,
                color: sig.statusColor === '#FF0000' ? '#FF0000' : sig.statusColor === '#FF8200' ? '#FF8200' : 'var(--color-ink-black)',
                letterSpacing: '0.04em'
              }}
            >
              {sig.value}
            </span>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: sig.statusColor,
                boxShadow: `0 0 6px ${sig.statusColor}`,
                flexShrink: 0
              }}
            />
          </div>
        </div>
      ))}
    </nav>
  );
};
