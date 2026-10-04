import React, { useState, useEffect } from 'react';
import { Shield, Clock, Bell, User, ChevronDown, Check, Search } from 'lucide-react';
import { useAppState } from '../../services/stateContext';
import type { UserRole } from '../../types';

export const OverviewHeader: React.FC = () => {
  const {
    campusStatus,
    userRole,
    setUserRole,
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

  const roles: { key: UserRole; label: string; desc: string }[] = [
    { key: 'admin', label: 'Administrator', desc: 'Full system & hardware privileges' },
    { key: 'security_officer', label: 'Security Officer', desc: 'Alerts, CCTV, doors, emergency' },
    { key: 'faculty', label: 'Faculty Member', desc: 'Zone occupancy & schedule access' },
    { key: 'student', label: 'Student', desc: 'Read-only campus status' },
  ];

  const currentRoleObj = roles.find((r) => r.key === userRole) || roles[0];

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
              color: '#5B6871',
            }}
          >
            <Shield size={13} color="#101820" />
            <span>SMART CAMPUS</span>
            <span style={{ color: 'rgba(16, 24, 32, 0.25)' }}>/</span>
            <span style={{ color: '#101820' }}>COMMAND CENTER</span>
          </div>

          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.75rem',
              color: '#5B6871',
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
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 24, 32, 0.1)',
            cursor: 'pointer',
            fontFamily: "var(--font-mono, monospace)",
            fontSize: '0.688rem',
            color: '#101820',
            fontWeight: 600,
          }}
          title="Open Command Palette (⌘K)"
        >
          <Search size={12} color="#5B6871" />
          <span>COMMANDS</span>
          <kbd
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 24, 32, 0.06)',
              color: '#5B6871',
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
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 24, 32, 0.08)',
            fontFamily: "var(--font-mono, monospace)",
            fontSize: '0.688rem',
            color: '#5B6871',
            letterSpacing: '0.04em',
          }}
        >
          <Clock size={12} color="#8C8C8C" />
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
            backgroundColor: unreadAlerts > 0 ? 'rgba(255, 130, 0, 0.08)' : '#FFFFFF',
            border: unreadAlerts > 0 ? '1px solid rgba(255, 130, 0, 0.3)' : '1px solid rgba(16, 24, 32, 0.08)',
            cursor: 'pointer',
            fontFamily: "var(--font-mono, monospace)",
            fontSize: '0.688rem',
            color: unreadAlerts > 0 ? '#FF8200' : '#5B6871',
            fontWeight: 600,
          }}
          title="Campus Incident & Alert Ledger"
        >
          <Bell size={12} color={unreadAlerts > 0 ? '#FF8200' : '#8C8C8C'} />
          <span>{unreadAlerts} ALERTS</span>
        </button>

        {/* Profile / Role Switcher Minimal Control */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(16, 24, 32, 0.12)',
              cursor: 'pointer',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.688rem',
              color: '#101820',
              fontWeight: 600,
            }}
          >
            <User size={12} color="#5B6871" />
            <span>ROLE: {currentRoleObj.label.toUpperCase()}</span>
            <ChevronDown size={11} color="#8C8C8C" />
          </button>

          {/* Role Dropdown */}
          {isRoleMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '260px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid rgba(16, 24, 32, 0.12)',
                boxShadow: '0 12px 32px rgba(16, 24, 32, 0.12)',
                padding: '6px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: '#8C8C8C',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(16, 24, 32, 0.06)',
                }}
              >
                Select Operational Role (RBAC)
              </div>

              {roles.map((r) => {
                const isSelected = r.key === userRole;
                return (
                  <button
                    key={r.key}
                    onClick={() => {
                      setUserRole(r.key);
                      setIsRoleMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'rgba(16, 24, 32, 0.05)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(16, 24, 32, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-display, sans-serif)",
                          fontSize: '0.813rem',
                          fontWeight: 600,
                          color: '#101820',
                        }}
                      >
                        {r.label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.688rem',
                          color: '#5B6871',
                          marginTop: '2px',
                        }}
                      >
                        {r.desc}
                      </div>
                    </div>
                    {isSelected && <Check size={14} color="#FF8200" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
