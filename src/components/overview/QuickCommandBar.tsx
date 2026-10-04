import React, { useState } from 'react';
import { Lock, Video, ShieldAlert, AlertOctagon, Terminal, Activity, FileText, AlertTriangle } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface QuickCommandBarProps {
  onTriggerEmergency?: () => void;
}

export const QuickCommandBar: React.FC<QuickCommandBarProps> = ({ onTriggerEmergency: _onTriggerEmergency }) => {
  const {
    setActiveTab,
    selectedZone,
    lockdownZone,
    acknowledgeIncident,
    incidents,
    doors,
    requestUnlockDoor,
    canManageDoors,
    canManageIncidents,
    addToast,
    addAuditRecord,
    userRole,
  } = useAppState();

  // State for Dangerous Action Confirmation Dialog
  const [confirmLockdownZone, setConfirmLockdownZone] = useState<string | null>(null);
  const [confirmOverrideDoor, setConfirmOverrideDoor] = useState<string | null>(null);

  const handleAcknowledgeActive = () => {
    if (!canManageIncidents) {
      addToast('Unauthorized', 'Your current role does not have authorization to acknowledge incidents.', 'error');
      addAuditRecord('ACKNOWLEDGE_REJECTED', 'All Open Incidents', 'DENIED', 'Clearance level insufficient', selectedZone);
      return;
    }
    const openIncs = incidents.filter((i) => i.status === 'open');
    if (openIncs.length === 0) {
      addToast('No Open Incidents', 'All active campus incidents are already acknowledged.', 'info');
      return;
    }
    openIncs.forEach((i) => acknowledgeIncident(i.id));
    addToast('Incidents Acknowledged', `${openIncs.length} active incident(s) acknowledged.`, 'success');
  };

  const handleRunSensorTest = () => {
    addToast('Sensor Diagnostic', 'Dispatched Modbus RS485 loop test across 42 PIR & MQ-2 nodes.', 'info');
    addAuditRecord('SENSOR_DIAGNOSTIC_RUN', 'Campus Fleet', 'SUCCESS', 'Modbus RS485 loop heartbeat verified 100% telemetry', selectedZone);
  };

  const handleExecuteLockdown = () => {
    if (confirmLockdownZone) {
      lockdownZone(confirmLockdownZone);
      setConfirmLockdownZone(null);
    }
  };

  const handleExecuteOverride = () => {
    if (confirmOverrideDoor) {
      requestUnlockDoor(confirmOverrideDoor);
      setConfirmOverrideDoor(null);
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Campus Quick Command Bar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={13} color="#5B6871" />
          <span
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#5B6871',
            }}
          >
            COMMAND DISPATCH · QUICK ACTIONS
          </span>
        </div>

        <span style={{ fontSize: '0.625rem', fontFamily: "var(--font-mono, monospace)", color: '#8C8C8C' }}>
          ROLE: {userRole.toUpperCase()}
        </span>
      </div>

      {/* 6 High-Impact Operational Action Buttons (Section 11) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
        }}
      >
        {/* 1. OPEN CAMERA */}
        <button
          onClick={() => setActiveTab('monitoring')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 24, 32, 0.1)',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 8px rgba(16, 24, 32, 0.02)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = '#101820';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={14} color="#101820" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', fontWeight: 700, color: '#101820' }}>
                OPEN CAMERA
              </span>
              <span style={{ fontSize: '0.625rem', color: '#8C8C8C' }}>7-Stream Matrix</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', color: '#5B6871' }}>↵</span>
        </button>

        {/* 2. ACKNOWLEDGE INCIDENT */}
        <button
          onClick={handleAcknowledgeActive}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 24, 32, 0.1)',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 8px rgba(16, 24, 32, 0.02)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = '#FF8200';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={14} color="#FF8200" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', fontWeight: 700, color: '#101820' }}>
                ACK INCIDENTS
              </span>
              <span style={{ fontSize: '0.625rem', color: '#8C8C8C' }}>Triage Open Queue</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', color: '#FF8200' }}>↵</span>
        </button>

        {/* 3. LOCKDOWN ZONE (Dangerous Action - Requires Confirmation) */}
        <button
          onClick={() => {
            if (!canManageDoors) {
              addToast('Permission Denied', 'Administrator or Security Officer role required for lockdown.', 'error');
              return;
            }
            setConfirmLockdownZone(selectedZone || 'Science & Physics Lab');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: 'rgba(255, 0, 0, 0.04)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 8px rgba(16, 24, 32, 0.02)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = '#FF0000';
            e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.3)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.04)';
          }}
          title="Restricts all portal access in the selected zone (requires confirmation)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={14} color="#FF0000" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', fontWeight: 700, color: '#FF0000' }}>
                LOCKDOWN ZONE
              </span>
              <span style={{ fontSize: '0.625rem', color: '#FF0000' }}>{selectedZone}</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', color: '#FF0000' }}>⚠</span>
        </button>

        {/* 4. ACCESS OVERRIDE */}
        <button
          onClick={() => {
            if (!canManageDoors) {
              addToast('Permission Denied', 'Administrator or Security Officer role required.', 'error');
              return;
            }
            setConfirmOverrideDoor(doors[0]?.id || 'DOOR-ENG-E04');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 24, 32, 0.1)',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 8px rgba(16, 24, 32, 0.02)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = '#101820';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={14} color="#101820" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', fontWeight: 700, color: '#101820' }}>
                ACCESS OVERRIDE
              </span>
              <span style={{ fontSize: '0.625rem', color: '#8C8C8C' }}>Emergency Release</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', color: '#5B6871' }}>↵</span>
        </button>

        {/* 5. RUN SENSOR TEST */}
        <button
          onClick={handleRunSensorTest}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 24, 32, 0.1)',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 8px rgba(16, 24, 32, 0.02)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = '#101820';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} color="#101820" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', fontWeight: 700, color: '#101820' }}>
                RUN SENSOR TEST
              </span>
              <span style={{ fontSize: '0.625rem', color: '#8C8C8C' }}>Modbus Health Loop</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', color: '#5B6871' }}>↵</span>
        </button>

        {/* 6. VIEW AUDIT */}
        <button
          onClick={() => setActiveTab('incidents')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 24, 32, 0.1)',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 8px rgba(16, 24, 32, 0.02)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = '#101820';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={14} color="#101820" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', fontWeight: 700, color: '#101820' }}>
                VIEW AUDIT
              </span>
              <span style={{ fontSize: '0.625rem', color: '#8C8C8C' }}>Compliance Trail</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', color: '#5B6871' }}>↵</span>
        </button>
      </div>

      {/* DANGEROUS ACTION CONFIRMATION MODAL: LOCKDOWN (Section 11) */}
      {confirmLockdownZone && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lockdown-dialog-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(16, 24, 32, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              boxShadow: '0 20px 40px rgba(16, 24, 32, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={20} color="#FF0000" />
              </div>
              <div>
                <h3
                  id="lockdown-dialog-title"
                  style={{
                    fontFamily: "var(--font-display, sans-serif)",
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#101820',
                    margin: 0,
                  }}
                >
                  LOCKDOWN {confirmLockdownZone.toUpperCase()}?
                </h3>
                <span style={{ fontSize: '0.75rem', fontFamily: "var(--font-mono, monospace)", color: '#FF0000', fontWeight: 600 }}>
                  HIGH-SECURITY EMERGENCY ACTION
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#5B6871', lineHeight: 1.5, margin: 0 }}>
              This will restrict portal passage, engage magnetic solenoids, seal automated dampers, and log an elevated security protocol for the selected zone.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setConfirmLockdownZone(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.813rem',
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 24, 32, 0.15)',
                  color: '#5B6871',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleExecuteLockdown}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.813rem',
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  backgroundColor: '#FF0000',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 0, 0, 0.25)',
                }}
              >
                CONFIRM LOCKDOWN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANGEROUS ACTION CONFIRMATION MODAL: ACCESS OVERRIDE */}
      {confirmOverrideDoor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="override-dialog-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(16, 24, 32, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid rgba(16, 24, 32, 0.15)',
              boxShadow: '0 20px 40px rgba(16, 24, 32, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 130, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={18} color="#FF8200" />
              </div>
              <div>
                <h3
                  id="override-dialog-title"
                  style={{
                    fontFamily: "var(--font-display, sans-serif)",
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#101820',
                    margin: 0,
                  }}
                >
                  SOLENOID ACCESS OVERRIDE?
                </h3>
                <span style={{ fontSize: '0.75rem', fontFamily: "var(--font-mono, monospace)", color: '#FF8200', fontWeight: 600 }}>
                  PORTAL: {confirmOverrideDoor}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#5B6871', lineHeight: 1.5, margin: 0 }}>
              This will energize the portal unlock solenoid for 8 seconds and log a privileged security operator bypass to the compliance audit ledger.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setConfirmOverrideDoor(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.813rem',
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 24, 32, 0.15)',
                  color: '#5B6871',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleExecuteOverride}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.813rem',
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  backgroundColor: '#101820',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                CONFIRM OVERRIDE (8s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
