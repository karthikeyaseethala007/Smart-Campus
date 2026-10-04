import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Lock, Unlock, KeyRound } from 'lucide-react';

export const InteractiveKeypad: React.FC = () => {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'GRANTED' | 'DENIED'>('IDLE');
  const [statusMsg, setStatusMsg] = useState('ENTER 4-DIGIT SECURITY PIN');
  const [relayState, setRelayState] = useState<'LOCKED' | 'UNLOCKED'>('LOCKED');

  const handleKeyPress = (num: string) => {
    if (status !== 'IDLE') return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setStatus('IDLE');
    setStatusMsg('ENTER 4-DIGIT SECURITY PIN');
    setRelayState('LOCKED');
  };

  const verifyPin = (code: string) => {
    if (code === '1234') {
      setStatus('GRANTED');
      setStatusMsg('AUTHENTICATED · MAIN PERIMETER SOLENOID OPEN');
      setRelayState('UNLOCKED');
      setTimeout(() => {
        handleClear();
      }, 3200);
    } else {
      setStatus('DENIED');
      setStatusMsg('ACCESS DENIED · SECURITY BREACH LOGGED');
      setRelayState('LOCKED');
      setTimeout(() => {
        handleClear();
      }, 3000);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'clamp(24px, 4vw, 48px)',
        alignItems: 'center',
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
      }}
    >
      {/* Visual Terminal Panel */}
      <div
        style={{
          backgroundColor: '#0D131A',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: 'clamp(24px, 3.5vw, 36px)',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Terminal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={14} color="#FF8200" />
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.688rem',
                letterSpacing: '0.14em',
                color: '#8C9BA5',
                textTransform: 'uppercase',
              }}
            >
              ZONE-A GATE CONTROLLER · ID-882
            </span>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.625rem',
              color: '#00E5FF',
              letterSpacing: '0.1em',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00E5FF' }} />
            ONLINE
          </span>
        </div>

        {/* Dynamic Display Screen */}
        <div
          style={{
            backgroundColor: '#05080C',
            borderRadius: '16px',
            border: `1px solid ${
              status === 'GRANTED' ? 'rgba(34, 197, 94, 0.4)' : status === 'DENIED' ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.06)'
            }`,
            padding: '24px 20px',
            textAlign: 'center',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'border-color 0.3s ease',
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              letterSpacing: '0.12em',
              color: status === 'GRANTED' ? '#22C55E' : status === 'DENIED' ? '#FF4444' : '#6E7F8D',
              marginBottom: '14px',
              textTransform: 'uppercase',
            }}
          >
            {statusMsg}
          </div>

          {/* PIN Digits / Dots */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {[0, 1, 2, 3].map((i) => {
              const hasDigit = pin.length > i;
              return (
                <motion.div
                  key={i}
                  animate={{
                    scale: hasDigit ? [1, 1.25, 1] : 1,
                    backgroundColor:
                      status === 'GRANTED'
                        ? '#22C55E'
                        : status === 'DENIED'
                        ? '#FF0000'
                        : hasDigit
                        ? '#FF8200'
                        : 'rgba(255, 255, 255, 0.1)',
                  }}
                  transition={{ duration: 0.18 }}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    boxShadow: hasDigit ? '0 0 12px rgba(255, 130, 0, 0.6)' : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Hardware Status Relay Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: '0.75rem',
          }}
        >
          <span style={{ color: '#8C9BA5' }}>SOLENOID INTERLOCK:</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: relayState === 'UNLOCKED' ? '#22C55E' : '#FF8200',
              fontWeight: 600,
            }}
          >
            {relayState === 'UNLOCKED' ? <Unlock size={14} /> : <Lock size={14} />}
            {relayState}
          </span>
        </div>
      </div>

      {/* Industrial Keypad Hardware */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            backgroundColor: '#121A22',
            padding: '16px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <motion.button
              key={k}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                if (k === 'C') handleClear();
                else if (k === '⌫') setPin((p) => p.slice(0, -1));
                else handleKeyPress(k);
              }}
              style={{
                height: '56px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: k === 'C' ? 'rgba(255, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                color: k === 'C' ? '#FF4444' : '#FFFFFF',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '1.15rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transition: 'background-color 0.15s ease',
              }}
            >
              {k}
            </motion.button>
          ))}
        </div>

        {/* Quick Test Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setPin('1234');
              verifyPin('1234');
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '9999px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              color: '#22C55E',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={13} />
            DEMO: 1234 (VALID)
          </button>

          <button
            onClick={() => {
              setPin('9999');
              verifyPin('9999');
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              backgroundColor: 'rgba(255, 0, 0, 0.08)',
              color: '#FF4444',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: '0.688rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ShieldAlert size={13} />
            DEMO: 9999 (INVALID)
          </button>
        </div>
      </div>
    </div>
  );
};
