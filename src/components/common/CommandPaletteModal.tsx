import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Video,
  MapPin,
  AlertTriangle,
  Zap,
  Lock,
  X,
  CornerDownLeft,
  ShieldAlert,
  Flame,
  RotateCcw
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const CommandPaletteModal: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    cameras,
    incidents,
    setSelectedCameraId,
    setSelectedZone,
    setActiveTab,
    setSelectedIncident,
    lockdownZone,
    triggerMQ2Elevation,
    resetSimulation,
    addToast,
    userRole
  } = useAppState();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Build searchable items
  interface PaletteItem {
    id: string;
    group: 'Cameras' | 'Campus Zones' | 'Incidents' | 'Quick Commands' | 'Navigation';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    action: () => void;
  }

  const items: PaletteItem[] = [
    // Commands
    {
      id: 'cmd-lockdown-science',
      group: 'Quick Commands',
      title: 'Lockdown Science & Physics Lab',
      subtitle: 'Emergency perimeter lock & high-security interlock',
      icon: <ShieldAlert size={14} color="#FF0000" />,
      action: () => {
        lockdownZone('Science & Physics Lab');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'cmd-trigger-gas',
      group: 'Quick Commands',
      title: 'Simulate MQ-2 Gas Elevation (640 ppm)',
      subtitle: 'Dispatches threshold spike in Science Lab 204',
      icon: <Flame size={14} color="#FF8200" />,
      action: () => {
        triggerMQ2Elevation(640);
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'cmd-reset-sim',
      group: 'Quick Commands',
      title: 'Reset All Simulations to Baseline',
      subtitle: 'Restore nominal sensors and clear active test flags',
      icon: <RotateCcw size={14} color="#22c55e" />,
      action: () => {
        resetSimulation();
        setIsCommandPaletteOpen(false);
      }
    },

    // Cameras
    ...cameras.map(cam => ({
      id: `cam-${cam.id}`,
      group: 'Cameras' as const,
      title: `${cam.name} (${cam.id})`,
      subtitle: `${cam.location} · ${cam.resolution} · ${cam.status.toUpperCase()}`,
      icon: <Video size={14} color="#101820" />,
      action: () => {
        setSelectedCameraId(cam.id);
        setSelectedZone(cam.zone);
        setActiveTab('overview');
        setIsCommandPaletteOpen(false);
        addToast('Surveillance Focused', `Primary feed switched to ${cam.name}.`, 'info');
      }
    })),

    // Campus Zones
    ...[
      'Main Gate',
      'Innovation & Robotics Lab',
      'Central Library',
      'Science & Physics Lab',
      'Academic Hallway',
      'Computer Lab',
      'Data Center / Server Room'
    ].map(zone => ({
      id: `zone-${zone}`,
      group: 'Campus Zones' as const,
      title: zone,
      subtitle: `Contextually filter telemetry, CCTV, and sensors for ${zone}`,
      icon: <MapPin size={14} color="#5B6871" />,
      action: () => {
        setSelectedZone(zone);
        setActiveTab('overview');
        setIsCommandPaletteOpen(false);
        addToast('Zone Context Filtered', `Focusing operations on ${zone}.`, 'info');
      }
    })),

    // Active Incidents
    ...incidents.filter(i => i.status !== 'resolved').map(inc => ({
      id: `inc-${inc.id}`,
      group: 'Incidents' as const,
      title: `${inc.id}: ${inc.event}`,
      subtitle: `${inc.location} · ${inc.severity.toUpperCase()} · ${inc.status.toUpperCase()}`,
      icon: <AlertTriangle size={14} color={inc.severity === 'critical' ? '#FF0000' : '#FF8200'} />,
      action: () => {
        setSelectedIncident(inc);
        setActiveTab('incidents');
        setIsCommandPaletteOpen(false);
      }
    })),

    // Navigation
    {
      id: 'nav-overview',
      group: 'Navigation',
      title: 'Command Center Home',
      subtitle: 'Primary operational overview stage',
      icon: <Zap size={14} color="#101820" />,
      action: () => {
        setActiveTab('overview');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'nav-cctv',
      group: 'Navigation',
      title: 'Surveillance Grid',
      subtitle: 'Multi-channel camera feeds & optical telemetry',
      icon: <Video size={14} color="#101820" />,
      action: () => {
        setActiveTab('monitoring');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'nav-access',
      group: 'Navigation',
      title: 'Access Control',
      subtitle: 'Keypad authentications, portals & maglocks',
      icon: <Lock size={14} color="#101820" />,
      action: () => {
        setActiveTab('security');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'nav-safety',
      group: 'Navigation',
      title: 'Life Safety & Sensors',
      subtitle: 'PIR motion, MQ-2 gas, and thermal fire sensors',
      icon: <Flame size={14} color="#FF8200" />,
      action: () => {
        setActiveTab('safety');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'nav-incidents',
      group: 'Navigation',
      title: 'Incident Ledger & Audit Trail',
      subtitle: 'Compliance logs, incident lifecycles, and audit records',
      icon: <AlertTriangle size={14} color="#5B6871" />,
      action: () => {
        setActiveTab('incidents');
        setIsCommandPaletteOpen(false);
      }
    }
  ];

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    item.group.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Smart Campus Command Palette"
      onClick={() => setIsCommandPaletteOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 15, 20, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 'clamp(48px, 12vh, 120px)',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#101820',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          animation: 'palettePop 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#0c1217'
          }}
        >
          <Search size={18} color="#FF8200" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, camera, zone, incident, or portal..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontFamily: "var(--font-display, 'Outfit', sans-serif)",
              fontSize: '1rem',
              letterSpacing: '-0.01em'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.625rem',
                color: 'rgba(255, 255, 255, 0.4)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              ESC to close
            </span>
            <button
              onClick={() => setIsCommandPaletteOpen(false)}
              aria-label="Close command palette"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div
          style={{
            overflowY: 'auto',
            maxHeight: '440px',
            padding: '8px'
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.45)',
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.813rem'
              }}
            >
              No matching commands or entities found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(255, 130, 0, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(255, 130, 0, 0.25)' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                    marginBottom: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'rgba(255, 130, 0, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                          fontFamily: "var(--font-display, 'Outfit', sans-serif)",
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.688rem',
                          color: isSelected ? '#FF8200' : 'rgba(255, 255, 255, 0.45)',
                          fontFamily: "var(--font-mono, monospace)",
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.group} · {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#FF8200',
                        fontSize: '0.688rem',
                        fontFamily: "var(--font-mono, monospace)"
                      }}
                    >
                      <span>SELECT</span>
                      <CornerDownLeft size={12} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Quick Keys */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#0c1217',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.688rem',
            fontFamily: "var(--font-mono, monospace)",
            color: 'rgba(255, 255, 255, 0.45)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>
            <span>ROLE: </span>
            <span style={{ color: '#FF8200', textTransform: 'uppercase', fontWeight: 600 }}>{userRole}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
