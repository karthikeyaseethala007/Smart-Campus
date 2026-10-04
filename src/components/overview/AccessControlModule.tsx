import React, { useState } from 'react';
import { Lock, Unlock, ChevronRight, Key, ShieldCheck } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

interface AccessControlModuleProps {
  onNavigate?: () => void;
}

export const AccessControlModule: React.FC<AccessControlModuleProps> = ({ onNavigate }) => {
  const {
    doors,
    setActiveTab,
    submitKeypadPin,
    requestUnlockDoor,
    canManageDoors,
  } = useAppState();

  const handleOpenAccess = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      setActiveTab('security');
    }
  };

  // Find high security server room door or fallback to first door
  const serverDoor =
    doors.find((d) => d.id === 'DOOR-ENG-E04' || d.name.toLowerCase().includes('server') || d.name.toLowerCase().includes('innovation')) ||
    doors[0] || {
      id: 'DOOR-ADM-SRV',
      name: 'Server Room',
      building: 'Data Center',
      zone: 'Data Center / Server Room',
      lockStatus: 'locked' as const,
      keypadStatus: 'normal' as const,
      failedAttempts: 0,
      isSecurityAlert: false,
      lastEventTime: '08:41:12',
      lastEventText: 'Authorized credential accepted',
    };

  const [pinInput, setPinInput] = useState('');
  const [authState, setAuthState] = useState<'IDLE' | 'SCANNING' | 'GRANTED' | 'DENIED' | 'SECURITY_ALERT'>('IDLE');
  const [authMessage, setAuthMessage] = useState<string>('');

  const isLocked = serverDoor.lockStatus === 'locked';

  const handlePinDigit = (digit: string) => {
    if (authState === 'SCANNING') return;
    if (pinInput.length < 4) {
      setPinInput((prev) => prev + digit);
    }
  };

  const handleClearPin = () => {
    setPinInput('');
    setAuthState('IDLE');
    setAuthMessage('');
  };

  const handleExecuteAuth = async (pinToTest?: string) => {
    const pin = pinToTest || pinInput;
    if (!pin) return;

    setAuthState('SCANNING');
    setAuthMessage('AUTHENTICATING CREDENTIAL...');

    // Controlled 600ms scanning delay to give physical feel
    setTimeout(async () => {
      const res = await submitKeypadPin(serverDoor.id, pin, 'live');
      if (res.success) {
        setAuthState('GRANTED');
        setAuthMessage('ACCESS GRANTED · SOLENOID RELEASED');
        setTimeout(() => {
          setAuthState('IDLE');
          setPinInput('');
        }, 3500);
      } else {
        if (serverDoor.failedAttempts + 1 >= 3) {
          setAuthState('SECURITY_ALERT');
          setAuthMessage('SECURITY ALERT · PORTAL LOCKED DOWN');
        } else {
          setAuthState('DENIED');
          setAuthMessage(`ACCESS DENIED · FAILED ATTEMPT (${serverDoor.failedAttempts + 1}/3)`);
        }
        setTimeout(() => {
          setAuthState('IDLE');
          setPinInput('');
        }, 3000);
      }
    }, 600);
  };

  return (
    <div
      role="region"
      aria-label="Access Control Console"
      style={{
        backgroundColor: 'var(--color-paper-white, #FFFFFF)',
        borderRadius: '16px',
        padding: '24px 28px',
        border: serverDoor.isSecurityAlert || authState === 'SECURITY_ALERT'
          ? '1px solid rgba(255, 0, 0, 0.4)'
          : authState === 'GRANTED'
          ? '1px solid rgba(34, 197, 94, 0.4)'
          : '1px solid rgba(16, 24, 32, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(16, 24, 32, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 24, 32, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLocked ? <Lock size={14} color="#101820" /> : <Unlock size={14} color="#22c55e" />}
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5B6871',
              }}
            >
              ACCESS CONTROL
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenAccess}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#8C8C8C',
            fontSize: '0.75rem',
            fontFamily: "var(--font-mono, monospace)",
            cursor: 'pointer',
          }}
        >
          <span>{doors.filter((d) => d.lockStatus === 'locked').length}/{doors.length} SECURED</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* PORTAL FOCUS: Server Room / Keypad E-04 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#FCFCFD',
          borderRadius: '10px',
          border: '1px solid rgba(16, 24, 32, 0.06)',
          marginBottom: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.625rem',
              color: '#8C8C8C',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            FOCUS PORTAL
          </div>
          <div
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#101820',
              marginTop: '2px',
            }}
          >
            {serverDoor.name.toUpperCase()}
          </div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.688rem', color: '#5B6871', marginTop: '2px' }}>
            {serverDoor.id} · {serverDoor.building}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Lock State Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.688rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: isLocked ? 'rgba(16, 24, 32, 0.08)' : 'rgba(34, 197, 94, 0.1)',
                color: isLocked ? '#101820' : '#22c55e',
                letterSpacing: '0.06em',
              }}
            >
              {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </span>
            <span style={{ fontSize: '0.625rem', color: '#8C8C8C', fontFamily: "var(--font-mono, monospace)", marginTop: '4px' }}>
              SOLENOID ARMED
            </span>
          </div>

          {/* Quick Remote Override */}
          <button
            onClick={() => requestUnlockDoor(serverDoor.id)}
            disabled={!canManageDoors}
            style={{
              padding: '6px 10px',
              fontSize: '0.688rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              backgroundColor: canManageDoors ? '#FFFFFF' : '#F5F5F5',
              border: '1px solid rgba(16, 24, 32, 0.15)',
              color: canManageDoors ? '#101820' : '#A0A0A0',
              borderRadius: '6px',
              cursor: canManageDoors ? 'pointer' : 'not-allowed',
            }}
            title={canManageDoors ? 'Emergency Solenoid Override (8s)' : 'Insufficient clearance'}
          >
            OVERRIDE
          </button>
        </div>
      </div>

      {/* METADATA: Authorized Users + Last Access */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#FCFCFD',
            borderRadius: '8px',
            border: '1px solid rgba(16, 24, 32, 0.06)',
          }}
        >
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: '#8C8C8C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AUTHORIZED USERS
          </div>
          <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.25rem', fontWeight: 700, color: '#101820', marginTop: '2px' }}>
            23
          </div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: '#5B6871', marginTop: '2px' }}>
            Active RFID / PIN Cards
          </div>
        </div>

        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#FCFCFD',
            borderRadius: '8px',
            border: '1px solid rgba(16, 24, 32, 0.06)',
          }}
        >
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: '#8C8C8C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            LAST ACCESS
          </div>
          <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: '1.25rem', fontWeight: 700, color: '#101820', marginTop: '2px' }}>
            {serverDoor.lastEventTime || '08:41:12'}
          </div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', color: '#22c55e', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {serverDoor.lastEventText || 'Authorized credential accepted'}
          </div>
        </div>
      </div>

      {/* INTERACTIVE PIN / SCAN DEMO CONSOLE (Section 8 State Machine) */}
      <div
        style={{
          padding: '14px',
          backgroundColor: authState === 'GRANTED'
            ? 'rgba(34, 197, 94, 0.04)'
            : authState === 'DENIED' || authState === 'SECURITY_ALERT'
            ? 'rgba(255, 0, 0, 0.04)'
            : '#F7F8F9',
          borderRadius: '10px',
          border: '1px solid rgba(16, 24, 32, 0.08)',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={12} color="#5B6871" />
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.625rem', fontWeight: 700, color: '#5B6871', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              KEYPAD PIN AUTHENTICATOR
            </span>
          </div>

          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.625rem',
              fontWeight: 700,
              color: authState === 'GRANTED' ? '#22c55e' : authState === 'DENIED' || authState === 'SECURITY_ALERT' ? '#FF0000' : '#5B6871',
            }}
          >
            {authState === 'IDLE' ? 'READY' : authState}
          </span>
        </div>

        {/* PIN Display Digits */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '10px',
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid rgba(16, 24, 32, 0.1)',
            marginBottom: '10px',
          }}
        >
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: pinInput.length > idx ? '#101820' : 'rgba(16, 24, 32, 0.1)',
                transition: 'background-color 0.15s ease',
              }}
            />
          ))}
          <span style={{ marginLeft: '12px', fontFamily: "var(--font-mono, monospace)", fontSize: '0.75rem', color: '#8C8C8C' }}>
            {pinInput ? pinInput.replace(/./g, '•') : 'ENTER 4-DIGIT PIN'}
          </span>
        </div>

        {/* Numeric Keypad Buttons 3x4 Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxWidth: '220px', margin: '0 auto 10px auto' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handlePinDigit(digit)}
              style={{
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 24, 32, 0.12)',
                color: '#101820',
                fontFamily: "var(--font-mono, monospace)",
                fontSize: '0.813rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s ease',
              }}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearPin}
            style={{
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 24, 32, 0.04)',
              border: '1px solid rgba(16, 24, 32, 0.08)',
              color: '#5B6871',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.625rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            CLR
          </button>
          <button
            type="button"
            onClick={() => handlePinDigit('0')}
            style={{
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(16, 24, 32, 0.12)',
              color: '#101820',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.813rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleExecuteAuth()}
            style={{
              height: '32px',
              borderRadius: '6px',
              backgroundColor: pinInput.length >= 4 ? '#101820' : 'rgba(16, 24, 32, 0.06)',
              border: 'none',
              color: pinInput.length >= 4 ? '#FFFFFF' : '#8A8F8D',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.625rem',
              fontWeight: 700,
              cursor: pinInput.length >= 4 ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            AUTH
          </button>
        </div>

        {/* Auth status announcement banner */}
        {authMessage && (
          <div
            style={{
              fontSize: '0.688rem',
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: '10px',
              color: authState === 'GRANTED' ? '#22c55e' : '#FF0000',
            }}
          >
            {authMessage}
          </div>
        )}

        {/* Quick Demo Credentials Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                setPinInput('4821');
                handleExecuteAuth('4821');
              }}
              disabled={authState === 'SCANNING'}
              style={{
                padding: '4px 8px',
                fontSize: '0.625rem',
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#22c55e',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Test valid PIN credential (4821)"
            >
              TEST PIN 4821 (VALID)
            </button>

            <button
              onClick={() => {
                setPinInput('9999');
                handleExecuteAuth('9999');
              }}
              disabled={authState === 'SCANNING'}
              style={{
                padding: '4px 8px',
                fontSize: '0.625rem',
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#FF0000',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Test invalid PIN attempt (triggers security alert at 3)"
            >
              TEST PIN 9999 (INVALID)
            </button>
          </div>

          {pinInput && (
            <button
              onClick={handleClearPin}
              style={{
                padding: '4px 8px',
                fontSize: '0.625rem',
                fontFamily: "var(--font-mono, monospace)",
                color: '#8C8C8C',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.688rem', fontFamily: "var(--font-mono, monospace)", color: '#5B6871', paddingTop: '10px', borderTop: '1px solid rgba(16, 24, 32, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={12} color="#22c55e" />
          <span>SOLENOID INTERLOCK ACTIVE · DEMO PINS: 4821 / 1234</span>
        </div>
        <button
          onClick={handleOpenAccess}
          style={{ background: 'none', border: 'none', color: '#FF8200', fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          VIEW LOGS →
        </button>
      </div>
    </div>
  );
};
