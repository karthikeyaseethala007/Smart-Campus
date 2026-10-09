import React, { useState, useEffect } from 'react';
import { Shield, Clock, Bell, ChevronDown, Search, ShieldCheck, LogOut } from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import { getHumanReadableRole } from '../../services/authService';

export const OverviewHeader: React.FC = () => {
  const {
    campusStatus,
    userRole,
    authSession,
    logout,
    alerts,
    setActiveTab,
    isSystemDegraded,
    setIsSystemDegraded,
    setIsCommandPaletteOpen,
  } = useAppState();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      setCurrentTime(`${dateStr.toUpperCase()} · ${timeStr} UTC`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const isEmergency = campusStatus === 'EMERGENCY';
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <header
      role="banner"
      aria-label="Smart Campus Command Center Header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '0 4px 16px 4px',
        borderBottom: '1px solid rgba(16, 24, 32, 0.08)',
      }}
    >
      {/* LEFT: Brand Identity & Operational Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-slate-gray)',
            }}
          >
            <Shield size={13} color="var(--color-ink-black)" />
            <span>SMART CAMPUS</span>
            <span style={{ color: 'var(--color-slate-gray)', opacity: 0.5 }}>/</span>
            <span style={{ color: 'var(--color-ink-black)' }}>COMMAND CENTER</span>
          </div>

          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.75rem',
              color: 'var(--color-slate-gray)',
              marginTop: '4px',
            }}
          >
            Campus operational status
          </div>
        </div>

        {/* Global Operational Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: isSystemDegraded
              ? 'rgba(255, 130, 0, 0.08)'
              : isEmergency
              ? 'rgba(255, 0, 0, 0.08)'
              : 'rgba(34, 197, 94, 0.08)',
            border: isSystemDegraded
              ? '1px solid rgba(255, 130, 0, 0.35)'
              : isEmergency
              ? '1px solid rgba(255, 0, 0, 0.3)'
              : '1px solid rgba(34, 197, 94, 0.3)',
            color: isSystemDegraded ? '#FF8200' : isEmergency ? '#FF0000' : '#22c55e',
            fontFamily: "var(--font-mono, monospace)",
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isSystemDegraded ? '#FF8200' : isEmergency ? '#FF0000' : '#22c55e',
              boxShadow: isSystemDegraded
                ? '0 0 8px #FF8200'
                : isEmergency
                ? '0 0 8px #FF0000'
                : '0 0 8px #22c55e',
            }}
          />
          <span>
            {isSystemDegraded
              ? 'SYSTEM DEGRADED · REALTIME OFFLINE'
              : isEmergency
              ? 'EMERGENCY PROTOCOL ACTIVE'
              : 'ALL SYSTEMS NOMINAL'}
          </span>
          {isSystemDegraded && (
            <button
              onClick={() => setIsSystemDegraded(false)}
              style={{
                marginLeft: '6px',
                padding: '2px 8px',
                fontSize: '0.625rem',
                backgroundColor: '#FF8200',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              RECONNECT
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: Search + Date/Time + Notifications + Role Switcher Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Command Palette Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface-canvas, #FFFFFF)',
            border: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.1))',
            cursor: 'pointer',
            fontFamily: "var(--font-mono, monospace)",
            fontSize: '0.688rem',
            color: 'var(--color-ink-black)',
            fontWeight: 600,
          }}
          title="Open Command Palette (⌘K)"
        >
          <Search size={12} color="var(--color-slate-gray)" />
          <span>COMMANDS</span>
          <kbd
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: 'var(--border-subtle, rgba(16, 24, 32, 0.06))',
              color: 'var(--color-slate-gray)',
              fontWeight: 700,
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Date / Time */}
        <div
          className="header-datetime-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface-canvas, #FFFFFF)',
            border: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.08))',
            fontFamily: "var(--font-mono, monospace)",
            fontSize: '0.688rem',
            color: 'var(--color-slate-gray)',
            letterSpacing: '0.04em',
          }}
        >
          <Clock size={12} color="var(--color-slate-gray)" />
          <span>{currentTime || 'OCT 26, 2026 · 08:45:00 UTC'}</span>
        </div>

        {/* Notifications Pill */}
        <button
          onClick={() => setActiveTab('incidents')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: unreadAlerts > 0 ? 'rgba(255, 130, 0, 0.08)' : 'var(--surface-canvas, #FFFFFF)',
            border: unreadAlerts > 0 ? '1px solid rgba(255, 130, 0, 0.3)' : '1px solid var(--border-subtle, rgba(16, 24, 32, 0.08))',
            cursor: 'pointer',
            fontFamily: "var(--font-mono, monospace)",
            fontSize: '0.688rem',
            color: unreadAlerts > 0 ? '#FF8200' : 'var(--color-slate-gray)',
            fontWeight: 600,
          }}
          title="Campus Incident & Alert Ledger"
        >
          <Bell size={12} color={unreadAlerts > 0 ? '#FF8200' : 'var(--color-slate-gray)'} />
          <span>{unreadAlerts} ALERTS</span>
        </button>

        {/* Active Session Clearance Indicator & Session Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-canvas, #FFFFFF)',
              border: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.12))',
              cursor: 'pointer',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.688rem',
              color: 'var(--color-ink-black)',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={12} color="#10B981" />
            <span>CLEARANCE: {getHumanReadableRole(userRole).toUpperCase()}</span>
            <ChevronDown size={11} color="var(--color-slate-gray)" />
          </button>

          {/* Active Session Details Popover */}
          {isRoleMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '260px',
                backgroundColor: 'var(--surface-card-mist, #FFFFFF)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.12))',
                boxShadow: 'var(--shadow-subtle-2, 0 12px 32px rgba(16, 24, 32, 0.12))',
                padding: '12px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '6px',
                  borderBottom: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.06))',
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: 'var(--color-slate-gray)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  ACTIVE SESSION
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.625rem', color: '#059669', fontWeight: 600 }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  Authenticated
                </span>
              </div>

              <div>
                <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '0.813rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
                  {authSession?.name || 'Chief Administrator Ramanujan'}
                </div>
                <div style={{ fontSize: '0.688rem', color: 'var(--color-slate-gray)', marginTop: '2px' }}>
                  {authSession?.email || `${authSession?.username || 'admin'}@campus.internal`}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface-section-fog, rgba(16, 24, 32, 0.04))',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ fontSize: '0.625rem', color: 'var(--color-slate-gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  CLEARANCE
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
                  {getHumanReadableRole(userRole)}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-slate-gray)' }}>
                  Badge: {authSession?.badgeNumber || 'BADGE-ADM-001'} · {authSession?.clearanceLevel || 'LEVEL_4_CHIEF'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle, rgba(16, 24, 32, 0.06))' }}>
                <button
                  onClick={async () => {
                    setIsRoleMenuOpen(false);
                    await logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: '#B91C1C',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={12} color="#B91C1C" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
