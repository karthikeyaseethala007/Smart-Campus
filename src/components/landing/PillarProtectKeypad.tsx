import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, CornerDownLeft, RotateCcw } from 'lucide-react';
import { useAppState } from '../../services/stateContext';

export const PillarProtectKeypad: React.FC = () => {
  const { submitKeypadPin } = useAppState();
  const [pin, setPin] = useState<string>('');
  const [doorState, setDoorState] = useState<'locked' | 'unlocked'>('locked');
  const [statusMessage, setStatusMessage] = useState<string>('READY FOR CREDENTIAL');
  const [statusType, setStatusType] = useState<'idle' | 'granted' | 'denied'>('idle');

  const handleDigit = (digit: string) => {
    if (statusType !== 'idle') return;
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleClear = () => {
    if (statusType !== 'idle') return;
    setPin('');
    setStatusMessage('READY FOR CREDENTIAL');
  };

  const handleSubmit = async () => {
    if (pin.length === 0 || statusType !== 'idle') return;

    if (pin === '1234') {
      setStatusType('granted');
      setStatusMessage('ACCESS GRANTED · SOLENOID RELEASED');
      setDoorState('unlocked');
      await submitKeypadPin('door-2', '1234', 'simulation');

      setTimeout(() => {
        setPin('');
        setStatusType('idle');
        setStatusMessage('SOLENOID RE-ENGAGED · SECURED');
        setDoorState('locked');
      }, 3200);
    } else {
      setStatusType('denied');
      setStatusMessage('ACCESS DENIED · INCIDENT LOGGED');
      await submitKeypadPin('door-2', pin, 'simulation');

      setTimeout(() => {
        setPin('');
        setStatusType('idle');
        setStatusMessage('READY FOR CREDENTIAL');
      }, 2200);
    }
  };

  // Allow physical keyboard typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        if (pin.length < 4 && statusType === 'idle') {
          setPin((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        if (statusType === 'idle') {
          setPin((prev) => prev.slice(0, -1));
        }
      } else if (e.key === 'Enter') {
        if (statusType === 'idle' && pin.length > 0) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, statusType]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'center',
        backgroundColor: 'var(--color-paper-white)',
        borderRadius: '1.5rem',
        padding: '36px',
        border: 'var(--border-hairline)',
        boxShadow: 'var(--shadow-subtle-2)',
      }}
    >
      {/* Left: Solenoid Relay Mechanism & Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-sienna-brown)',
              fontWeight: 600,
            }}
          >
            Pillar 01 · PROTECT
          </span>
          <span style={{ color: 'var(--color-smoke-gray)' }}>/</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-gray)' }}>
            Zone 02 · Engineering E-04
          </span>
        </div>

        <h3
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'var(--color-ink-black)',
          }}
        >
          High-Torque Solenoid Interlock
        </h3>

        <p
          style={{
            fontSize: '0.938rem',
            color: 'var(--color-slate-gray)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Physical security enforced at the edge. The ESP32 reader verifies digital credentials locally, latching the 12V 1.5A solenoid bolt with microsecond telemetry logging.
        </p>

        {/* Physical Latch Visualizer */}
        <div
          style={{
            backgroundColor: 'var(--color-primary-950)',
            borderRadius: '1rem',
            padding: '24px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: doorState === 'unlocked' ? '#22c55e' : statusType === 'denied' ? '#ff0000' : '#ff8200',
                  boxShadow: doorState === 'unlocked' ? '0 0 10px #22c55e' : statusType === 'denied' ? '0 0 10px #ff0000' : '0 0 10px #ff8200',
                  transition: 'all 0.2s var(--ease-out)',
                }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {doorState === 'unlocked' ? 'SOLENOID RETRACTED (UNLOCKED)' : 'SOLENOID ENGAGED (LOCKED)'}
              </span>
            </div>

            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
              12VDC · 1.5A · GPIO 26
            </span>
          </div>

          {/* Mechanical Solenoid Cross-Section */}
          <div
            style={{
              height: '56px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: '8px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Strike Plate Fixed Boundary */}
            <div
              style={{
                width: '12px',
                height: '36px',
                backgroundColor: '#8a8f8d',
                borderRadius: '3px',
                position: 'absolute',
                left: '20px',
              }}
            />

            {/* Moving Solenoid Bolt */}
            <motion.div
              animate={{
                x: doorState === 'unlocked' ? 80 : 0,
                backgroundColor: doorState === 'unlocked' ? '#22c55e' : statusType === 'denied' ? '#ff0000' : '#ff8200',
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{
                width: '80px',
                height: '24px',
                borderRadius: '4px',
                position: 'absolute',
                left: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#000000',
                letterSpacing: '0.08em',
              }}
            >
              {doorState === 'unlocked' ? 'OPEN' : 'LOCKED'}
            </motion.div>

            {/* Solenoid Coil Housing */}
            <div
              style={{
                position: 'absolute',
                right: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '32px',
                    backgroundColor: doorState === 'unlocked' ? '#ff8200' : 'rgba(255,255,255,0.2)',
                    borderRadius: '2px',
                    transition: 'background-color 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '0.75rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              Optical Sensor: <strong style={{ color: '#ffffff' }}>Contact Closed</strong>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              Relay Cycles: <strong style={{ color: '#ffffff' }}>14,921</strong>
            </span>
          </div>
        </div>

        {/* Demo Test Instructions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--color-primary-100)',
            padding: '12px 18px',
            borderRadius: '9999px',
            border: '1px solid var(--border-hairline)',
            fontSize: '0.813rem',
          }}
        >
          <KeyRound size={15} color="var(--color-sienna-brown)" />
          <span style={{ color: 'var(--color-ink-black)' }}>
            Interactive Demo: Enter <strong style={{ color: 'var(--color-sienna-brown)', fontFamily: 'monospace' }}>1234</strong> (Authorized) or <strong style={{ color: '#ef4444', fontFamily: 'monospace' }}>9999</strong> (Security Audit).
          </span>
        </div>
      </div>

      {/* Right: Tactile Edge PIN Keypad Hardware Widget */}
      <div
        style={{
          backgroundColor: '#101820',
          borderRadius: '1.25rem',
          padding: '28px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          maxWidth: '340px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Terminal Screen */}
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '0.75rem',
            padding: '14px 16px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.688rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: statusType === 'granted' ? '#22c55e' : statusType === 'denied' ? '#ef4444' : '#8a8f8d',
              fontWeight: 600,
              minHeight: '18px',
              transition: 'color 0.2s ease',
            }}
          >
            {statusMessage}
          </div>

          {/* 4-Digit Input Representation */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
              margin: '12px 0 6px 0',
              height: '32px',
            }}
          >
            {[0, 1, 2, 3].map((index) => {
              const hasDigit = pin.length > index;
              return (
                <motion.div
                  key={index}
                  animate={{
                    scale: hasDigit ? [1, 1.2, 1] : 1,
                    backgroundColor: hasDigit
                      ? statusType === 'granted'
                        ? '#22c55e'
                        : statusType === 'denied'
                        ? '#ef4444'
                        : '#ff8200'
                      : 'rgba(255,255,255,0.12)',
                  }}
                  transition={{ duration: 0.15 }}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* 3x4 Tactile Keypad Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="keypad-tactile-btn"
              style={{
                height: '52px',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.1s var(--ease-out), background-color 0.15s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 130, 0, 0.2)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
            >
              {digit}
            </button>
          ))}

          {/* Clear Key */}
          <button
            onClick={handleClear}
            style={{
              height: '52px',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#8a8f8d',
              fontSize: '0.813rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'transform 0.1s var(--ease-out)',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.94)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <RotateCcw size={14} />
            <span>CLR</span>
          </button>

          {/* 0 Key */}
          <button
            onClick={() => handleDigit('0')}
            style={{
              height: '52px',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontSize: '1.25rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s var(--ease-out)',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.94)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            0
          </button>

          {/* Enter Key */}
          <button
            onClick={handleSubmit}
            disabled={pin.length === 0}
            style={{
              height: '52px',
              borderRadius: '0.5rem',
              backgroundColor: pin.length > 0 ? '#ff8200' : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: pin.length > 0 ? '#000000' : '#8a8f8d',
              fontSize: '0.813rem',
              fontWeight: 700,
              cursor: pin.length > 0 ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s var(--ease-out)',
            }}
            onMouseDown={(e) => {
              if (pin.length > 0) e.currentTarget.style.transform = 'scale(0.94)';
            }}
            onMouseUp={(e) => {
              if (pin.length > 0) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <CornerDownLeft size={14} />
            <span>ENT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
