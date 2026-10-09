import React, { useState } from 'react';
import {
  Shield,
  Search,
  Bell,
  ChevronDown,
  Radio,
  Flame,
  AlertTriangle,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import { getHumanReadableRole } from '../../services/authService';
import { AnimatedList } from '../ui/animated-list';
import { ThemeToggle } from '../ui/theme-toggle';

export const TopBar: React.FC = () => {
  const {
    userRole,
    authSession,
    logout,
    isSimulationActive,
    alerts,
    setActiveTab,
    setSelectedIncident,
    incidents,
    setIsCommandPaletteOpen,
  } = useAppState();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.acknowledged);

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

          {/* Top-Right Authenticated Account Identity Control */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="pill-btn-ghost topbar-role-btn"
              aria-label="Account Identity and Clearance"
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                gap: '8px',
                borderColor: 'rgba(23, 25, 28, 0.15)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-ink-black)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {authSession?.name ? authSession.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span className="topbar-role-label" style={{ fontWeight: 600, color: 'var(--color-ink-black)' }}>
                  {authSession?.name || 'Chief Administrator Ramanujan'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-slate-gray)' }}>
                  {getHumanReadableRole(userRole)}
                </span>
              </div>
              <ChevronDown size={13} color="var(--color-slate-gray)" />
            </button>

            {isAccountMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '280px',
                  backgroundColor: 'var(--color-paper-white)',
                  borderRadius: 'var(--radius-elevatedcards)',
                  boxShadow: 'var(--shadow-subtle-2)',
                  border: 'var(--border-hairline)',
                  padding: '12px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Header: ACCOUNT & STATUS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: 'var(--border-hairline)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-ash-gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    ACCOUNT
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#059669', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} /> Authenticated
                  </span>
                </div>

                {/* Account Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-ink-black)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {authSession?.name ? authSession.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink-black)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {authSession?.name || 'Chief Administrator Ramanujan'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-slate-gray)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {authSession?.email || `${authSession?.username || 'admin'}@campus.internal`}
                    </div>
                  </div>
                </div>

                {/* Clearance Info Card */}
                <div
                  style={{
                    backgroundColor: 'var(--color-mist-gray)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-slate-gray)', fontWeight: 600 }}>
                    CLEARANCE
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-black)' }}>
                    {getHumanReadableRole(userRole)}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-ash-gray)' }}>
                    Badge: {authSession?.badgeNumber || 'BADGE-ADM-001'} · {authSession?.clearanceLevel || 'LEVEL_4_CHIEF'}
                  </span>
                </div>

                {/* Functional Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: 'var(--border-hairline)' }}>
                  <button
                    onClick={() => {
                      setActiveTab('security');
                      setIsAccountMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--color-ink-black)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-mist-gray)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <ShieldCheck size={14} color="var(--color-slate-gray)" />
                    <span>Security & access</span>
                  </button>

                  <button
                    onClick={async () => {
                      setIsAccountMenuOpen(false);
                      await logout();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#B91C1C',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={14} color="#B91C1C" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
