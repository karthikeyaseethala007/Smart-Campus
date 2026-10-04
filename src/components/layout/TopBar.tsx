import React, { useState } from 'react';
import {
  Shield,
  Search,
  Bell,
  ChevronDown,
  Radio,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import type { UserRole } from '../../types';
import { AnimatedList } from '../ui/animated-list';
import { ThemeToggle } from '../ui/theme-toggle';

export const TopBar: React.FC = () => {
  const {
    userRole,
    setUserRole,
    isSimulationActive,
    alerts,
    setActiveTab,
    setSelectedIncident,
    incidents,
    setIsCommandPaletteOpen,
  } = useAppState();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.acknowledged);

  const roles: { key: UserRole; label: string; desc: string }[] = [
    { key: 'admin', label: 'Administrator', desc: 'Full system & hardware privileges' },
    { key: 'security_officer', label: 'Security Officer', desc: 'Alerts, CCTV, doors, emergency' },
    { key: 'faculty', label: 'Faculty Member', desc: 'Zone occupancy & schedule access' },
    { key: 'student', label: 'Student', desc: 'Read-only campus status' }
  ];

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'var(--color-paper-white)',
        borderBottom: 'var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div className="topbar-inner-container">
        {/* Left: Brand Identity in Signifier Serif */}
        <div
          onClick={() => setActiveTab('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', userSelect: 'none' }}
          title="Return to Public Editorial Landing"
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-ink-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-paper-white)'
            }}
          >
            <Shield size={17} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              className="topbar-brand-title"
              style={{
                fontFamily: 'var(--font-signifier)',
                fontSize: '20px',
                fontWeight: 400,
                color: 'var(--color-ink-black)',
                letterSpacing: '-0.3px'
              }}
            >
              Smart Campus <em style={{ fontStyle: 'italic', color: 'var(--color-slate-gray)' }}>Security</em>
            </span>
            <span
              className="topbar-brand-subtitle"
              style={{
                fontFamily: 'var(--font-sohne)',
                fontSize: '12px',
                color: 'var(--color-ash-gray)',
                letterSpacing: 0
              }}
            >
              / Operations
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="topbar-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Link back to Public Landing */}
          <button
            onClick={() => setActiveTab('landing')}
            className="pill-btn-ghost topbar-landing-btn"
            style={{ fontSize: '12px', padding: '5px 14px' }}
            title="Switch to Public Landing Page"
          >
            ← Public Landing
          </button>

          {/* Persistent Simulation Badge if Active in Peach Accent */}
          {isSimulationActive && (
            <button
              onClick={() => setActiveTab('overview')}
              className="pill-badge pill-badge-peach"
              style={{ cursor: 'pointer', border: 'none', padding: '6px 14px' }}
              title="A hardware simulation scenario is currently active"
            >
              <Radio size={13} color="var(--color-sienna-brown)" />
              <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.02em' }}>Simulation active</span>
            </button>
          )}

          {/* Command Palette Trigger & Search */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="topbar-search-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              backgroundColor: 'var(--color-mist-gray)',
              borderRadius: 'var(--radius-buttons)',
              padding: '6px 12px',
              width: '210px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s ease',
            }}
            title="Open Command Palette (⌘K or Ctrl+K)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} color="var(--color-slate-gray)" />
              <span className="topbar-search-text" style={{ fontFamily: 'var(--font-sohne)', fontSize: '13px', color: 'var(--color-slate-gray)' }}>
                Search campus...
              </span>
            </div>
            <kbd
              className="topbar-search-kbd"
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '10px',
                padding: '2px 5px',
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 24, 32, 0.08)',
                color: 'var(--color-slate-gray)',
                border: '1px solid rgba(16, 24, 32, 0.1)',
                fontWeight: 600,
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* System Online Status Indicator */}
          <div
            className="pill-badge pill-badge-neutral topbar-online-pill"
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            <span className="status-dot status-dot-safe" />
            <span className="topbar-online-text" style={{ color: 'var(--color-ink-black)', fontWeight: 450 }}>Online</span>
          </div>

          {/* Notifications Drawer Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="Campus alerts and notifications"
              style={{
                position: 'relative',
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                border: 'var(--border-hairline)',
                backgroundColor: isNotifOpen ? 'var(--color-mist-gray)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-ink-black)'
              }}
            >
              <Bell size={16} />
              {unreadAlerts.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: 'var(--color-ink-black)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 600,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '340px',
                  backgroundColor: 'var(--color-paper-white)',
                  borderRadius: 'var(--radius-elevatedcards)',
                  boxShadow: 'var(--shadow-subtle-2)',
                  border: 'var(--border-hairline)',
                  padding: '16px',
                  zIndex: 200
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: 'var(--border-hairline)', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-signifier)', fontSize: '18px', color: 'var(--color-ink-black)' }}>
                    Alerts & Notifications
                  </span>
                  <span className="pill-badge pill-badge-neutral" style={{ fontSize: '11px' }}>
                    {unreadAlerts.length} unacknowledged
                  </span>
                </div>

                {alerts.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-slate-gray)', fontSize: '14px' }}>
                    No notifications recorded
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <AnimatedList delay={0} className="gap-2">
                      {alerts.slice(0, 5).map(alert => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            if (alert.incidentId) {
                              const inc = incidents.find(i => i.id === alert.incidentId);
                              if (inc) setSelectedIncident(inc);
                            }
                            setActiveTab('incidents');
                            setIsNotifOpen(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '12px',
                            backgroundColor: alert.acknowledged ? 'transparent' : 'var(--color-mist-gray)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px'
                          }}
                        >
                          <div style={{ marginTop: '2px' }}>
                            {alert.severity === 'critical' ? (
                              <Flame size={15} color="var(--color-sienna-brown)" />
                            ) : (
                              <AlertTriangle size={15} color="var(--color-ink-black)" />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-black)' }}>
                              {alert.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-slate-gray)', marginTop: '2px' }}>
                              {alert.location} · {alert.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                    </AnimatedList>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Skiper26 Global Light/Dark Mode Toggle */}
          <ThemeToggle />

          {/* Minimalist Role Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="pill-btn-ghost topbar-role-btn"
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                gap: '8px',
                borderColor: 'rgba(23, 25, 28, 0.15)'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-ink-black)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600
                }}
              >
                {userRole.charAt(0).toUpperCase()}
              </div>
              <span className="topbar-role-label" style={{ textTransform: 'capitalize', color: 'var(--color-ink-black)' }}>
                {roles.find(r => r.key === userRole)?.label || userRole}
              </span>
              <ChevronDown size={13} color="var(--color-slate-gray)" />
            </button>

            {isRoleDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '240px',
                  backgroundColor: 'var(--color-paper-white)',
                  borderRadius: 'var(--radius-elevatedcards)',
                  boxShadow: 'var(--shadow-subtle-2)',
                  border: 'var(--border-hairline)',
                  padding: '8px',
                  zIndex: 200
                }}
              >
                <div style={{ padding: '8px 12px 6px', fontSize: '11px', color: 'var(--color-ash-gray)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Role-Based Clearance
                </div>
                {roles.map(r => (
                  <button
                    key={r.key}
                    onClick={() => {
                      setUserRole(r.key);
                      setIsRoleDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      textAlign: 'left',
                      backgroundColor: userRole === r.key ? 'var(--color-mist-gray)' : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: userRole === r.key ? 500 : 400, color: 'var(--color-ink-black)' }}>
                      {r.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-slate-gray)' }}>
                      {r.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
