import React, { useState } from 'react';
import { 
  Cpu, 
  Activity, 
  Flame, 
  Lock, 
  Lightbulb, 
  Fan, 
  Gauge, 
  Video
} from 'lucide-react';
import { useAppState } from '../services/stateContext';
import type { DeviceCategory } from '../types';

export const DevicesView: React.FC = () => {
  const { devices, setSelectedDevice, searchQuery } = useAppState();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All Fleet' },
    { key: 'motion', label: 'Motion' },
    { key: 'smoke', label: 'Smoke & Fire' },
    { key: 'door_lock', label: 'Access Locks' },
    { key: 'keypad', label: 'Keypads' },
    { key: 'camera', label: 'Surveillance' },
    { key: 'light', label: 'Lighting Relays' },
    { key: 'fan', label: 'HVAC Dampers' },
    { key: 'power_meter', label: 'Power Meters' }
  ];

  const filteredDevices = devices.filter(dev => {
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'smoke' ? (dev.category === 'smoke' || dev.category === 'fire') : dev.category === selectedCategory);
    const matchesStatus = selectedStatus === 'all' || dev.status === selectedStatus;
    const matchesSearch = !searchQuery || 
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getCategoryIcon = (cat: DeviceCategory) => {
    switch (cat) {
      case 'motion': return <Activity size={15} />;
      case 'smoke':
      case 'fire': return <Flame size={15} />;
      case 'keypad':
      case 'door_lock': return <Lock size={15} />;
      case 'light': return <Lightbulb size={15} />;
      case 'fan': return <Fan size={15} />;
      case 'power_meter': return <Gauge size={15} />;
      case 'camera': return <Video size={15} />;
      default: return <Cpu size={15} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Editorial Section Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="heading-editorial">
            Hardware <em>fleet directory.</em>
          </h1>
          <p className="subhead-editorial" style={{ marginTop: '6px' }}>
            Telemetry, signal health, and battery levels for {devices.length} monitored campus sensor nodes.
          </p>
        </div>

        {/* Quick summary pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div className="pill-badge pill-badge-neutral">
            <span className="status-dot status-dot-safe" />
            <span>{devices.filter(d => d.status === 'online').length} Online</span>
          </div>
          <div className="pill-badge pill-badge-neutral">
            <span className="status-dot status-dot-warning" />
            <span>{devices.filter(d => d.status === 'offline' || d.status === 'warning').length} Attention</span>
          </div>
        </div>
      </div>

      {/* Filter Controls with Steep Pill Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(c => {
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`pill-btn-sm ${isSelected ? 'active' : ''}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter Sub-bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginRight: '4px' }}>Status:</span>
            {(['all', 'online', 'warning', 'critical', 'offline'] as const).map(st => {
              const isSelected = selectedStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`pill-btn-sm ${isSelected ? 'active' : ''}`}
                  style={{ padding: '4px 12px', fontSize: '12px', textTransform: 'capitalize' }}
                >
                  {st}
                </button>
              );
            })}
          </div>

          <span className="tag-category">
            Showing {filteredDevices.length} of {devices.length} nodes
          </span>
        </div>
      </div>

      {/* Devices Grid — Steep 24px Neutral Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {filteredDevices.map(dev => {
          const isOnline = dev.status === 'online';
          const isCritical = dev.status === 'critical';

          return (
            <div 
              key={dev.id}
              className="neutral-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                cursor: 'pointer',
                padding: '24px'
              }}
              onClick={() => setSelectedDevice(dev)}
            >
              <div>
                {/* Header: Title and Location */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-sohne)', fontSize: '16px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                      {dev.name}
                    </h4>
                    <div style={{ fontSize: '13px', color: 'var(--color-slate-gray)', marginTop: '2px' }}>
                      {dev.location}
                    </div>
                  </div>

                  <div style={{ color: 'var(--color-slate-gray)', padding: '6px', backgroundColor: 'var(--color-paper-white)', borderRadius: '9999px' }}>
                    {getCategoryIcon(dev.category)}
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '10px 0' }}>
                  <span className={`status-dot ${isOnline ? 'status-dot-safe' : isCritical ? 'status-dot-critical' : 'status-dot-warning'}`} />
                  <span 
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      color: 'var(--color-ink-black)'
                    }}
                  >
                    {dev.status.toUpperCase()}
                  </span>
                </div>

                {/* Telemetry Block in Paper White */}
                <div 
                  style={{
                    backgroundColor: 'var(--color-paper-white)',
                    borderRadius: 'var(--radius-smallcards)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-slate-gray)' }}>Battery</span>
                    <strong style={{ color: 'var(--color-ink-black)' }}>{dev.batteryPct !== undefined ? `${dev.batteryPct}%` : 'Hardwired'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-slate-gray)' }}>Signal</span>
                    <strong style={{ color: 'var(--color-ink-black)' }}>{dev.signalStrength !== undefined ? `-${dev.signalStrength} dBm` : 'Ethernet'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-slate-gray)' }}>Last seen</span>
                    <strong style={{ color: 'var(--color-ink-black)' }}>{dev.lastUpdated}</strong>
                  </div>
                </div>
              </div>

              {/* Card Footer with Text Link Arrow */}
              <div 
                style={{
                  borderTop: 'var(--border-hairline)',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--color-slate-gray)', fontFamily: 'monospace' }}>
                  {dev.id}
                </span>

                <span className="text-link-arrow" style={{ fontSize: '13px' }}>
                  Diagnostics →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
